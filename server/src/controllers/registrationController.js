import { body, validationResult } from 'express-validator';
import GstRegistration from '../models/GstRegistration.js';
import { getNextGstApplicationId } from '../models/Counter.js';
import { uploadFile, getReadableUrl } from '../services/storageService.js';
import { generateAcknowledgementPdf, streamPdfToResponse } from '../services/pdfService.js';
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
    for (const k of DOC_KEYS) {
      if (files[k] && files[k].length) {
        const f = files[k][0];
        try {
          uploaded[k] = await uploadFile(f.path, f.originalname, f.detectedMime || f.mimetype, `gst/${applicationId}`);
        } catch (e) {
          logger.warn(`Upload failed for ${k}: ${e.message} — storing filename only`);
          uploaded[k] = { url: null, publicId: null, originalName: f.originalname, mimeType: f.detectedMime || f.mimetype, sizeBytes: 0, uploadedAt: new Date() };
        }
      }
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

    let photoBuffer = null;
    try {
      if (uploaded.photo?.url) {
        const url = await getReadableUrl(uploaded.photo);
        if (url) {
          const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
          photoBuffer = Buffer.from(r.data, 'binary');
        }
      }
    } catch (e) { logger.warn('Photo fetch for PDF failed', e.message); }

    let pdfFileRef = null;
    try {
      pdfFileRef = await generateAcknowledgementPdf(reg, photoBuffer);
      reg.delivery.pdfUrl = pdfFileRef.url;
      await reg.save();
    } catch (e) {
      logger.error(`PDF generation failed: ${e.message}\n${e.stack}`);
    }

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';

    const [sheetRes, emailRes, adminEmailRes, waRes, waAdminRes] = await Promise.allSettled([
      appendRegistration(reg),
      sendApplicantAcknowledgement(reg, pdfFileRef),
      sendAdminNotification(reg, pdfFileRef),
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
  try {
    const { applicationId } = req.params;
    const reg = await GstRegistration.findOne({ applicationId });
    if (!reg) return res.status(404).json({ error: 'Application not found' });

    // stream from Cloudinary if available
    if (reg.delivery?.pdfUrl) {
      try {
        const fetchUrl = reg.delivery.pdfUrl.startsWith('http')
          ? reg.delivery.pdfUrl
          : `${process.env.API_BASE_URL || ''}${reg.delivery.pdfUrl}`;
        const remote = await axios.get(fetchUrl, { responseType: 'stream', timeout: 20000 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${applicationId}-acknowledgement.pdf"`);
        return remote.data.pipe(res);
      } catch (e) {
        logger.warn(`PDF stream from storage failed, regenerating: ${e.message}`);
      }
    }

    // regenerate and stream directly to browser without storing
    let photoBuffer = null;
    try {
      if (reg.documents?.photo?.url) {
        const url = await getReadableUrl(reg.documents.photo);
        if (url) {
          const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
          photoBuffer = Buffer.from(r.data);
        }
      }
    } catch (e) { logger.warn('Photo fetch for PDF regen failed', e.message); }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${applicationId}-acknowledgement.pdf"`);
    await streamPdfToResponse(reg, photoBuffer, res);
  } catch (e) {
    next(e);
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
    const pdfFileRef = reg.delivery.pdfUrl ? { url: reg.delivery.pdfUrl, originalName: `${reg.applicationId}-acknowledgement.pdf`, mimeType: 'application/pdf' } : null;
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
