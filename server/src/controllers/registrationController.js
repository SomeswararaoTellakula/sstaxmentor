import fs from 'fs';
import { body, validationResult } from 'express-validator';
import GstRegistration from '../models/GstRegistration.js';
import { getNextGstApplicationId } from '../models/Counter.js';
import { uploadFile, getReadableUrl } from '../services/storageService.js';
import { generateAcknowledgementPdf } from '../services/pdfService.js';
import { appendRegistration, updateStatus } from '../services/sheetsService.js';
import { sendApplicantAcknowledgement, sendAdminNotification, sendStatusUpdate } from '../services/mailService.js';
import { sendRegistrationReceived, sendStatusUpdate as sendWaStatus, sendArnGenerated, sendAdminNotification as sendWaAdmin } from '../services/whatsappService.js';
import { cleanupUploaded } from '../middleware/upload.js';
import logger from '../utils/logger.js';
import { validateAadhaarChecksum, validatePAN, validateIndianMobile, validatePincode, INDIAN_STATES } from '../utils/validators.js';
import axios from 'axios';

const DOC_KEYS = ['aadhaarCard','panCard','photo','electricityBill','rentalAgreement','propertyTaxReceipt','ownerAadhaarFile','witnessAadhaarFile','bankProof'];
const MANDATORY_UPLOADS = ['aadhaarCard','panCard','photo','electricityBill'];

const BUSINESS_TYPES = ['Proprietorship','Partnership','LLP','Private Limited','Public Limited','HUF','Trust/Society','Other'];

export const registerValidators = [
  body('applicantName').isLength({ min: 3, max: 100 }).matches(/^[A-Za-z .']+$/),
  body('mobile').custom(v => { if (!validateIndianMobile(v)) throw new Error('Invalid Indian mobile number'); return true; }),
  body('altMobile').optional({ values: 'falsy' }).custom(v => { if (!validateIndianMobile(v)) throw new Error('Invalid mobile number'); return true; }),
  body('email').isEmail().normalizeEmail(),
  body('firmName').isLength({ min: 3, max: 150 }),
  body('businessType').isIn(BUSINESS_TYPES),
  body('businessNature').optional({ values: 'falsy' }).isLength({ max: 200 }),
  body('firmAddress').isLength({ min: 10, max: 300 }),
  body('city').isLength({ min: 2, max: 60 }),
  body('state').isIn(INDIAN_STATES),
  body('pincode').custom(v => { if (!validatePincode(v)) throw new Error('Invalid 6-digit pincode'); return true; }),
  body('premisesType').isIn(['Owned', 'Rented']),
  body('panNumber').custom(v => { if (!validatePAN(v)) throw new Error('Invalid PAN format'); return true; }),
  body('aadhaarNumber').custom(v => { if (!validateAadhaarChecksum(v)) throw new Error('Invalid Aadhaar number'); return true; }),
  body('ownerMobile').optional({ values: 'falsy' }).custom(v => { if (!validateIndianMobile(v)) throw new Error('Invalid owner mobile'); return true; }),
  body('witnessMobile').optional({ values: 'falsy' }).custom(v => { if (!validateIndianMobile(v)) throw new Error('Invalid witness mobile'); return true; }),
  body('remarks').optional({ values: 'falsy' }).isLength({ max: 500 }),
  body('consent').equals('true'),
];

export async function registerSubmission(req, res, next) {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      cleanupUploaded(req);
      return res.status(400).json({ error: 'Validation failed', issues: errs.array() });
    }
    const files = req.files || {};
    for (const key of MANDATORY_UPLOADS) {
      if (!files[key] || !files[key].length) {
        cleanupUploaded(req);
        return res.status(400).json({ error: `Missing mandatory document: ${key}` });
      }
    }
    const applicationId = await getNextGstApplicationId();
    const uploaded = {};
    const docBuffers = {};
    try {
      for (const k of DOC_KEYS) {
        if (files[k] && files[k].length) {
          const f = files[k][0];
          const mime = f.detectedMime || f.mimetype;
          // Read the bytes BEFORE uploadFile removes the temp file. These are
          // reused for the merged client PDF and the admin attachments, which
          // avoids re-downloading everything from Cloudinary.
          try {
            docBuffers[k] = { buffer: fs.readFileSync(f.path), mimeType: mime, originalName: f.originalname };
          } catch (e) {
            logger.warn(`Could not buffer ${k}: ${e.message}`);
          }
          uploaded[k] = await uploadFile(f.path, f.originalname, mime, `gst/${applicationId}`);
        }
      }
    } catch (e) {
      cleanupUploaded(req);
      return res.status(500).json({ error: 'Document upload failed', detail: e.message });
    }

    const reg = new GstRegistration({
      applicationId,
      applicantName: req.body.applicantName.trim(),
      mobile: req.body.mobile,
      altMobile: req.body.altMobile || undefined,
      email: req.body.email,
      firmName: req.body.firmName.trim(),
      businessType: req.body.businessType,
      businessNature: req.body.businessNature || undefined,
      firmAddress: req.body.firmAddress.trim(),
      city: req.body.city.trim(),
      state: req.body.state,
      pincode: req.body.pincode,
      premisesType: req.body.premisesType,
      panNumber: req.body.panNumber,
      aadhaarNumber: req.body.aadhaarNumber,
      documents: uploaded,
      ownerName: req.body.ownerName || undefined,
      ownerMobile: req.body.ownerMobile || undefined,
      witnessName: req.body.witnessName || undefined,
      witnessMobile: req.body.witnessMobile || undefined,
      remarks: req.body.remarks || undefined,
      consentAt: new Date(),
      meta: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        source: req.body.source || 'website',
      },
    });

    await reg.save();
    logger.info(`Saved ${applicationId}`);

    const photoBuffer = docBuffers.photo?.buffer || null;

    let pdfFileRef = null;
    let pdfBuffer = null;
    try {
      const pdf = await generateAcknowledgementPdf(reg, photoBuffer, docBuffers);
      pdfFileRef = pdf.fileRef;
      pdfBuffer = pdf.buffer;
      reg.delivery.pdfUrl = pdfFileRef.url;
      // Needed to build a SIGNED download URL later. Cloudinary refuses
      // unsigned delivery of raw assets, which is how a PDF is stored.
      reg.delivery.pdfPublicId = pdfFileRef.publicId;
      await reg.save();
    } catch (e) {
      logger.error(`PDF generation failed: ${e.message}\n${e.stack}`);
    }

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';

    const [sheetRes, emailRes, adminEmailRes, waRes, waAdminRes] = await Promise.allSettled([
      appendRegistration(reg),
      sendApplicantAcknowledgement(reg, pdfFileRef, pdfBuffer),
      sendAdminNotification(reg, pdfFileRef, pdfBuffer, docBuffers),
      sendRegistrationReceived(reg, pdfFileRef, baseUrl),
      sendWaAdmin(reg),
    ]);

    const pick = (r) => r.status === 'fulfilled' ? r.value : { ok: false, error: r.reason?.message || 'unknown' };
    const sheet = pick(sheetRes);
    const email = pick(emailRes);
    const adminEmail = pick(adminEmailRes);
    const wa = pick(waRes);
    const waAdmin = pick(waAdminRes);

    reg.delivery.sheetSynced = { ...sheet, attempts: 1 };
    reg.delivery.emailSent = { ...email, attempts: 1 };
    reg.delivery.whatsappSent = { ...wa, attempts: 1 };
    await reg.save();

    void adminEmail; void waAdmin;

    return res.status(201).json({
      applicationId,
      pdfUrl: pdfFileRef ? `${process.env.API_BASE_URL || ''}/api/gst/${applicationId}/pdf` : null,
      delivery: {
        sheetSynced: { ok: sheet.ok },
        emailSent: { ok: email.ok },
        whatsappSent: { ok: wa.ok },
      },
    });
  } catch (err) {
    cleanupUploaded(req);
    next(err);
  }
}

export async function downloadPdf(req, res, next) {
  const { applicationId } = req.params;
  try {
    const reg = await GstRegistration.findOne({ applicationId });
    if (!reg || !reg.delivery?.pdfUrl) return res.status(404).json({ error: 'PDF not found' });

    // Sign the URL when we have the publicId. Cloudinary refuses unsigned
    // delivery of raw assets, so the stored secure_url alone returns 401.
    const url = await getReadableUrl({
      url: reg.delivery.pdfUrl,
      publicId: reg.delivery.pdfPublicId,
      mimeType: 'application/pdf',
    });
    if (!url) return res.status(404).json({ error: 'PDF not available' });

    const remote = await axios.get(url, { responseType: 'stream', timeout: 20000 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${applicationId}-acknowledgement.pdf"`);
    return remote.data.pipe(res);
  } catch (e) {
    logger.error(`PDF download failed for ${applicationId}: ${e.message}`);
    return next(e);
  }
}

export async function trackApplication(req, res, next) {
  try {
    const { applicationId } = req.params;
    const reg = await GstRegistration.findOne({ applicationId }).select(
      'applicationId status arn gstin createdAt updatedAt applicantName firmName mobile email'
    );
    if (!reg) return res.status(404).json({ error: 'Application not found' });
    res.json({
      applicationId: reg.applicationId,
      status: reg.status,
      arn: reg.arn || null,
      gstin: reg.gstin || null,
      submittedAt: reg.createdAt,
      updatedAt: reg.updatedAt,
      applicantName: reg.applicantName,
      firmName: reg.firmName,
    });
  } catch (e) {
    next(e);
  }
}

export async function retryFailedDeliveries() {
  logger.info('Retry job: checking failed deliveries');
  const cursor = GstRegistration.find({
    $or: [
      { 'delivery.sheetSynced.ok': false, 'delivery.sheetSynced.attempts': { $lt: 3 } },
      { 'delivery.emailSent.ok': false, 'delivery.emailSent.attempts': { $lt: 3 } },
      { 'delivery.whatsappSent.ok': false, 'delivery.whatsappSent.attempts': { $lt: 3 } },
    ],
  }).cursor();

  for await (const reg of cursor) {
    // Carry publicId through so the retry can sign the URL as well.
    const pdfFileRef = reg.delivery.pdfUrl
      ? {
          url: reg.delivery.pdfUrl,
          publicId: reg.delivery.pdfPublicId,
          originalName: `${reg.applicationId}-acknowledgement.pdf`,
          mimeType: 'application/pdf',
        }
      : null;
    if (reg.delivery.sheetSynced.ok === false && (reg.delivery.sheetSynced.attempts || 0) < 3) {
      const r = await appendRegistration(reg);
      reg.delivery.sheetSynced = { ...r, attempts: (reg.delivery.sheetSynced.attempts || 0) + 1 };
    }
    if (reg.delivery.emailSent.ok === false && (reg.delivery.emailSent.attempts || 0) < 3) {
      const r = await sendApplicantAcknowledgement(reg, pdfFileRef);
      reg.delivery.emailSent = { ...r, attempts: (reg.delivery.emailSent.attempts || 0) + 1 };
    }
    if (reg.delivery.whatsappSent.ok === false && (reg.delivery.whatsappSent.attempts || 0) < 3) {
      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
      const r = await sendRegistrationReceived(reg, pdfFileRef, baseUrl);
      reg.delivery.whatsappSent = { ...r, attempts: (reg.delivery.whatsappSent.attempts || 0) + 1 };
    }
    await reg.save();
  }
  logger.info('Retry job: finished');
}

export default {
  registerSubmission,
  downloadPdf,
  trackApplication,
  retryFailedDeliveries,
  registerValidators,
};
