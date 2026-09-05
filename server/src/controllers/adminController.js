import { body, validationResult } from 'express-validator';
import GstRegistration from '../models/GstRegistration.js';
import AdminUser from '../models/AdminUser.js';
import { signAdminToken, setAdminCookie, clearAdminCookie } from '../middleware/auth.js';
import { sendStatusUpdate as sendMailStatus } from '../services/mailService.js';
import { sendStatusUpdate as sendWaStatus, sendArnGenerated } from '../services/whatsappService.js';
import { updateStatus as sheetsUpdate } from '../services/sheetsService.js';
import { getReadableUrl, deleteFile } from '../services/storageService.js';
import logger from '../utils/logger.js';
import { maskAadhaar } from '../utils/encryption.js';
import { formatMobileDisplay } from '../utils/validators.js';

const STATUSES = ['Submitted','Under Review','Documents Pending','Filed','ARN Generated','Approved','Rejected'];

export const loginValidators = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
];

export async function adminLogin(req, res, next) {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: 'Invalid input' });
    const admin = await AdminUser.findOne({ email: String(req.body.email).toLowerCase() });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await admin.checkPassword(req.body.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    admin.lastLoginAt = new Date();
    admin.lastLoginIp = req.ip;
    await admin.save();
    const token = signAdminToken(admin);
    setAdminCookie(res, token);
    res.json({
      ok: true,
      admin: { email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (e) { next(e); }
}

export async function adminLogout(req, res) {
  clearAdminCookie(res);
  res.json({ ok: true });
}

export async function adminMe(req, res) {
  res.json({ ok: true, admin: { email: req.admin.email, name: req.admin.name, role: req.admin.role } });
}

export async function listRegistrations(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const perPage = Math.min(100, Number(req.query.perPage || 20));
    const status = req.query.status;
    const q = String(req.query.q || '').trim();
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const filter = {};
    if (status && STATUSES.includes(status)) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = new Date(to.getTime() + 86400000);
    }
    if (q) {
      const qNum = q.replace(/\D/g, '');
      filter.$or = [
        { applicantName: { $regex: q, $options: 'i' } },
        { firmName: { $regex: q, $options: 'i' } },
        { applicationId: { $regex: q, $options: 'i' } },
      ];
      if (qNum.length >= 6) filter.$or.push({ mobile: { $regex: qNum } });
    }
    const [count, list] = await Promise.all([
      GstRegistration.countDocuments(filter),
      GstRegistration.find(filter)
        .select('-aadhaarNumber -documents -internalNotes')
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage),
    ]);
    res.json({ count, page, perPage, items: list });
  } catch (e) { next(e); }
}

export async function getRegistrationDetail(req, res, next) {
  try {
    const { id } = req.params;
    const reg = await GstRegistration.findOne({
      $or: [{ applicationId: id }, { _id: id }],
    }).select('+aadhaarNumber');
    if (!reg) return res.status(404).json({ error: 'Not found' });
    const docUrls = {};
    const docs = reg.documents || {};
    for (const [k, v] of Object.entries(docs)) {
      if (v) docUrls[k] = { ...v.toObject ? v.toObject() : v, signedUrl: await getReadableUrl(v) };
    }
    const plain = reg.decryptAadhaar();
    const obj = reg.toObject();
    obj.aadhaarFull = plain;
    obj.aadhaarMasked = plain ? maskAadhaar(plain) : (reg.aadhaarLast4 ? `XXXX XXXX ${reg.aadhaarLast4}` : '');
    obj.documents = docUrls;
    if (obj.delivery?.pdfUrl) {
      obj.delivery.pdfSignedUrl = await getReadableUrl({ ...docs.aadhaarCard, url: obj.delivery.pdfUrl, publicId: undefined });
    }
    res.json(obj);
  } catch (e) { next(e); }
}

export async function updateRegistration(req, res, next) {
  try {
    const { id } = req.params;
    const { status, arn, gstin, internalNotes } = req.body || {};
    const reg = await GstRegistration.findOne({ $or: [{ applicationId: id }, { _id: id }] });
    if (!reg) return res.status(404).json({ error: 'Not found' });
    const changes = {};
    let statusChanged = false;
    let arnChanged = false;
    if (status && STATUSES.includes(status) && status !== reg.status) {
      changes.status = status;
      statusChanged = true;
    }
    if (arn !== undefined) { changes.arn = arn || null; if (arn && arn !== reg.arn) arnChanged = true; }
    if (gstin !== undefined) changes.gstin = gstin || null;
    if (internalNotes !== undefined) changes.internalNotes = String(internalNotes || '').slice(0, 2000);
    Object.assign(reg, changes);
    await reg.save();

    if (statusChanged) {
      await Promise.allSettled([
        sendMailStatus(reg, reg.status, { arn: reg.arn, gstin: reg.gstin }),
        sendWaStatus(reg, reg.status),
        sheetsUpdate(reg.applicationId, reg.status, { arn: reg.arn, gstin: reg.gstin }),
      ]);
    } else if (arnChanged) {
      await Promise.allSettled([
        sendMailStatus(reg, reg.status, { arn: reg.arn, gstin: reg.gstin }),
        sendArnGenerated(reg, reg.arn),
        sheetsUpdate(reg.applicationId, reg.status, { arn: reg.arn, gstin: reg.gstin }),
      ]);
    }

    res.json({ ok: true, updated: changes });
  } catch (e) { next(e); }
}

export async function resendChannel(req, res, next) {
  try {
    const { id } = req.params;
    const { channel } = req.body || {};
    const reg = await GstRegistration.findOne({ $or: [{ applicationId: id }, { _id: id }] });
    if (!reg) return res.status(404).json({ error: 'Not found' });
    const pdfFileRef = reg.delivery.pdfUrl ? { url: reg.delivery.pdfUrl, originalName: `${reg.applicationId}-acknowledgement.pdf`, mimeType: 'application/pdf' } : null;
    let result = { ok: false, error: 'Unknown channel' };
    if (channel === 'email') {
      result = await (await import('../services/mailService.js')).sendApplicantAcknowledgement(reg, pdfFileRef);
      reg.delivery.emailSent = { ...result, attempts: (reg.delivery.emailSent.attempts || 0) + 1 };
    } else if (channel === 'whatsapp') {
      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
      result = await (await import('../services/whatsappService.js')).sendRegistrationReceived(reg, pdfFileRef, baseUrl);
      reg.delivery.whatsappSent = { ...result, attempts: (reg.delivery.whatsappSent.attempts || 0) + 1 };
    } else if (channel === 'sheet') {
      result = await (await import('../services/sheetsService.js')).appendRegistration(reg);
      reg.delivery.sheetSynced = { ...result, attempts: (reg.delivery.sheetSynced.attempts || 0) + 1 };
    }
    await reg.save();
    res.json({ ok: result.ok, channel, result });
  } catch (e) { next(e); }
}

function escCsv(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportCsv(req, res, next) {
  try {
    const status = req.query.status;
    const filter = {};
    if (status && STATUSES.includes(status)) filter.status = status;
    const items = await GstRegistration.find(filter).sort({ createdAt: -1 }).select('+aadhaarNumber').lean();
    const headers = [
      'Submitted At','Application ID','Status','Applicant','Mobile','Alt','Email',
      'Firm','Type','Nature','Address','City','State','PIN','Premises','PAN','Aadhaar (masked)',
      'Owner','Owner Mobile','Witness','Witness Mobile','Remarks','ARN','GSTIN',
    ];
    const lines = [headers.map(escCsv).join(',')];
    for (const r of items) {
      const masked = r.aadhaarLast4 ? `XXXX XXXX ${r.aadhaarLast4}` : '';
      lines.push([
        r.createdAt?.toISOString(), r.applicationId, r.status,
        r.applicantName, r.mobile, r.altMobile || '', r.email,
        r.firmName, r.businessType, r.businessNature || '',
        r.firmAddress, r.city, r.state, r.pincode, r.premisesType,
        r.panNumber, masked,
        r.ownerName || '', r.ownerMobile || '', r.witnessName || '', r.witnessMobile || '',
        (r.remarks || '').replace(/\n/g, ' '),
        r.arn || '', r.gstin || '',
      ].map(escCsv).join(','));
    }
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="gst-registrations-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (e) { next(e); }
}

export async function adminStats(req, res, next) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const total = await GstRegistration.countDocuments();
    const thisMonth = await GstRegistration.countDocuments({ createdAt: { $gte: monthStart } });
    const byStatus = await GstRegistration.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
    const map = {};
    for (const s of STATUSES) map[s] = 0;
    for (const r of byStatus) if (r._id) map[r._id] = r.n;
    res.json({ total, thisMonth, byStatus: map });
  } catch (e) { next(e); }
}

export async function deleteRecord(req, res, next) {
  try {
    const { id } = req.params;
    const reg = await GstRegistration.findOne({ $or: [{ applicationId: id }, { _id: id }] });
    if (!reg) return res.status(404).json({ error: 'Not found' });
    const docs = reg.documents || {};
    for (const v of Object.values(docs)) await deleteFile(v);
    await GstRegistration.deleteOne({ _id: reg._id });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export default {
  adminLogin, adminLogout, adminMe,
  listRegistrations, getRegistrationDetail, updateRegistration,
  resendChannel, exportCsv, adminStats, deleteRecord,
};
