import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import logger from '../utils/logger.js';
import { getReadableUrl } from './storageService.js';
import { formatMobileDisplay } from '../utils/validators.js';
import { maskAadhaar } from '../utils/encryption.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function applicantHtml({ reg, pdfAttachmentName, baseUrl }) {
  const masked = reg.aadhaarLast4 ? `XXXX XXXX ${reg.aadhaarLast4}` : maskAadhaar('');
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
body{font-family:Inter,Arial,sans-serif;background:#F5F8FF;margin:0;padding:24px;color:#111827}
.card{max-width:640px;margin:auto;background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(26,79,214,.08);overflow:hidden}
.head{background:#1A4FD6;padding:20px 28px;color:#fff}
.head h1{margin:0;font-family:Poppins,Arial;font-size:20px}
.head p{margin:4px 0 0;opacity:.9;font-size:13px}
.body{padding:28px}
.pill{display:inline-block;padding:6px 12px;border-radius:999px;background:#E8EEFC;color:#1A4FD6;font-weight:600;font-size:13px}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
td{padding:10px 8px;border-bottom:1px solid #E5E7EB}
td:first-child{color:#6B7280;width:40%}
td:last-child{color:#0B1B3A;font-weight:600}
.btn{display:inline-block;padding:12px 22px;background:#1A4FD6;color:#fff!important;text-decoration:none;border-radius:999px;font-weight:600}
.note{background:#F5F8FF;border-left:3px solid #1A4FD6;padding:12px 14px;font-size:13px;border-radius:0 10px 10px 0;margin-top:20px}
.footer{text-align:center;color:#6B7280;font-size:12px;padding:20px 28px;background:#FAFBFF;border-top:1px solid #E5E7EB}
</style></head><body>
<div class="card">
  <div class="head">
    <h1>SS TAX MENTORS</h1>
    <p>Reach Us & Relax</p>
  </div>
  <div class="body">
    <p>Dear <b>${reg.applicantName}</b>,</p>
    <p>We have received your GST Registration application. Reference details are below.</p>
    <div><span class="pill">Application ID: ${reg.applicationId}</span> <span class="pill" style="background:#ECFDF5;color:#16A34A;margin-left:6px">Status: ${reg.status}</span></div>
    <table>
      <tr><td>Firm Name</td><td>${reg.firmName}</td></tr>
      <tr><td>Business Type</td><td>${reg.businessType}</td></tr>
      <tr><td>Mobile</td><td>${formatMobileDisplay(reg.mobile)}</td></tr>
      <tr><td>Email</td><td>${reg.email}</td></tr>
      <tr><td>State / City</td><td>${reg.state} · ${reg.city}</td></tr>
      <tr><td>PAN</td><td>${reg.panNumber}</td></tr>
      <tr><td>Aadhaar</td><td>${masked}</td></tr>
    </table>
    <p style="text-align:center;margin:24px 0 12px">
      <a class="btn" href="${baseUrl}/track/${reg.applicationId}">Track your application</a>
    </p>
    <div class="note">
      <b>Next steps:</b><br>
      1. Documents verified within 1 working day.<br>
      2. Application filed on GST Portal → ARN shared via Email + WhatsApp.<br>
      3. GSTIN delivered on approval.
    </div>
  </div>
  <div class="footer">
    www.sstaxmentors.com · +91 8179726723 · someshtellakula@gmail.com
  </div>
</div>
</body></html>`;
}

function applicantText({ reg, baseUrl }) {
  return `SS Tax Mentors — GST Registration Received\n\nHi ${reg.applicantName},\nApplication ID: ${reg.applicationId}\nFirm: ${reg.firmName}\nStatus: ${reg.status}\nTrack: ${baseUrl}/track/${reg.applicationId}\n\nCall: +91 8179726723`;
}

function adminHtml({ reg, docLinks, adminUrl }) {
  const rows = Object.entries(docLinks).map(([k, v]) => `<tr><td>${k}</td><td>${v ? `<a href="${v.url}">${v.name}</a>` : '—'}</td></tr>`).join('');
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
body{font-family:Inter,Arial,sans-serif;background:#fff;margin:0;padding:24px;color:#111827}
h1{font-family:Poppins,Arial;color:#0B1B3A;margin:0 0 8px}
.badge{display:inline-block;padding:4px 10px;background:#FEF3C7;color:#92400E;border-radius:999px;font-size:12px;font-weight:600}
table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13px}
td,th{padding:8px;border:1px solid #E5E7EB;text-align:left}
th{background:#F5F8FF;color:#1A4FD6}
.btn{display:inline-block;padding:8px 14px;background:#1A4FD6;color:#fff!important;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px}
</style></head><body>
<h1>🔔 New GST Registration — ${reg.firmName}</h1>
<div><span class="badge">${reg.applicationId}</span> <span class="badge" style="background:#DBEAFE;color:#1E40AF;margin-left:6px">${reg.status}</span></div>
<table>
  <tr><th width="30%">Applicant</th><td>${reg.applicantName}</td><th>Mobile</th><td>${formatMobileDisplay(reg.mobile)}</td></tr>
  <tr><th>Email</th><td>${reg.email}</td><th>Alt Mobile</th><td>${reg.altMobile ? formatMobileDisplay(reg.altMobile) : '—'}</td></tr>
  <tr><th>Firm</th><td>${reg.firmName}</td><th>Type</th><td>${reg.businessType}</td></tr>
  <tr><th>City / State</th><td>${reg.city} · ${reg.state}</td><th>PIN</th><td>${reg.pincode}</td></tr>
  <tr><th>PAN</th><td>${reg.panNumber}</td><th>Premises</th><td>${reg.premisesType}</td></tr>
</table>
<h3 style="margin:14px 0 4px;color:#0B1B3A">Documents</h3>
<table><tr><th>Document</th><th>Link</th></tr>${rows}</table>
<p style="margin:20px 0"><a class="btn" href="${adminUrl}/admin/${reg.applicationId}">Open in Admin Dashboard →</a></p>
</body></html>`;
}

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function brevoConfigured() {
  return !!(process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL);
}

export function verifyMailer() {
  if (!brevoConfigured()) {
    logger.warn('BREVO_API_KEY or MAIL_FROM_EMAIL missing — email delivery disabled');
    return false;
  }
  logger.info('Brevo email API configured');
  return true;
}

/**
 * Build the Brevo attachment.
 * Prefers the in-memory buffer (fresh sends); falls back to fetching the
 * stored URL, which is what the 15-minute retry cron has to use.
 */
async function buildAttachment(pdfFileRef, pdfBuffer) {
  if (pdfBuffer) {
    return {
      name: pdfFileRef?.originalName || 'acknowledgement.pdf',
      content: Buffer.from(pdfBuffer).toString('base64'),
    };
  }
  try {
    const url = await getReadableUrl(pdfFileRef);
    if (!url || (url.startsWith('/') && !process.env.API_BASE_URL)) return null;
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
    return {
      name: pdfFileRef?.originalName || 'acknowledgement.pdf',
      content: Buffer.from(res.data).toString('base64'),
    };
  } catch (e) {
    logger.warn(`PDF attach fetch failed: ${e.message}`);
    return null;
  }
}

/** Single transport for every email. Returns Brevo's { messageId }. */
async function sendViaBrevo({ to, subject, html, text, attachment, attachments, replyTo }) {
  const recipients = String(to || '')
    .split(',')
    .map((e) => ({ email: e.trim() }))
    .filter((r) => r.email);
  if (!recipients.length) throw new Error('No valid recipient');

  const payload = {
    sender: {
      name: process.env.MAIL_FROM_NAME || 'SS Tax Mentors',
      email: process.env.MAIL_FROM_EMAIL,
    },
    to: recipients,
    subject,
    htmlContent: html,
  };
  if (text) payload.textContent = text;
  if (replyTo) payload.replyTo = { email: replyTo };
  const attachList = attachments?.length ? attachments : (attachment ? [attachment] : []);
  if (attachList.length) payload.attachment = attachList;

  try {
    const res = await axios.post(BREVO_URL, payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      timeout: 20000,
    });
    return res.data;
  } catch (e) {
    const detail = e.response?.data ? JSON.stringify(e.response.data) : e.message;
    throw new Error(`Brevo ${e.response?.status || ''}: ${detail}`);
  }
}

export async function sendApplicantAcknowledgement(reg, pdfFileRef, pdfBuffer = null) {
  if (!brevoConfigured()) return { ok: false, error: 'Brevo not configured' };
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
  const attachment = (pdfFileRef || pdfBuffer) ? await buildAttachment(pdfFileRef, pdfBuffer) : null;
  try {
    const info = await sendViaBrevo({
      to: reg.email,
      replyTo: process.env.ADMIN_EMAIL,
      subject: `GST Registration Received — ${reg.applicationId} | SS Tax Mentors`,
      text: applicantText({ reg, baseUrl }),
      html: applicantHtml({ reg, baseUrl, pdfAttachmentName: pdfFileRef?.originalName }),
      attachment,
    });
    logger.info(`Applicant email sent ${reg.applicationId}: ${info.messageId}`);
    return { ok: true, at: new Date(), messageId: info.messageId };
  } catch (e) {
    logger.error(`Applicant email error: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

/** Brevo caps total payload size; stay well under it. */
const MAX_ATTACH_BYTES = 8 * 1024 * 1024;

const ADMIN_DOC_ATTACHMENTS = [
  { key: 'aadhaarCard', label: 'Aadhaar' },
  { key: 'panCard', label: 'PAN' },
  { key: 'photo', label: 'Photo' },
  { key: 'electricityBill', label: 'ElectricityBill' },
];

/** Acknowledgement plus each document as a separate file, for the admin copy. */
function buildAdminAttachments(reg, ackAttachment, docBuffers = {}) {
  const list = [];
  let total = 0;
  if (ackAttachment) {
    list.push(ackAttachment);
    total += Buffer.byteLength(ackAttachment.content, 'base64');
  }
  for (const { key, label } of ADMIN_DOC_ATTACHMENTS) {
    const d = docBuffers?.[key];
    if (!d?.buffer) continue;
    if (total + d.buffer.length > MAX_ATTACH_BYTES) {
      logger.warn(`Admin attachment ${key} skipped — size cap reached`);
      continue;
    }
    const ext = (d.originalName || '').split('.').pop() || 'bin';
    list.push({
      name: `${reg.applicationId}-${label}.${ext}`,
      content: Buffer.from(d.buffer).toString('base64'),
    });
    total += d.buffer.length;
  }
  return list;
}

export async function sendAdminNotification(reg, pdfFileRef, pdfBuffer = null, docBuffers = null) {
  if (!brevoConfigured()) return { ok: false, error: 'Brevo not configured' };
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return { ok: false, error: 'ADMIN_EMAIL not set' };
  const adminUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
  const docs = reg.documents || {};
  const keys = ['aadhaarCard','panCard','photo','electricityBill','rentalAgreement','propertyTaxReceipt','ownerAadhaarFile','witnessAadhaarFile','bankProof'];
  const labels = ['Aadhaar','PAN','Photo','Electricity Bill','Rental Agreement','Property Tax','Owner Aadhaar','Witness Aadhaar','Bank Proof'];
  const docLinks = {};
  for (let i = 0; i < keys.length; i++) {
    const ref = docs[keys[i]];
    if (!ref) { docLinks[labels[i]] = null; continue; }
    docLinks[labels[i]] = { url: await getReadableUrl(ref), name: ref.originalName };
  }
  const ack = (pdfFileRef || pdfBuffer) ? await buildAttachment(pdfFileRef, pdfBuffer) : null;
  const attachments = buildAdminAttachments(reg, ack, docBuffers);
  try {
    const info = await sendViaBrevo({
      to: adminEmail,
      replyTo: reg.email,
      subject: `New GST Registration — ${reg.firmName} (${reg.applicationId})`,
      html: adminHtml({ reg, docLinks, adminUrl }),
      attachments,
    });
    logger.info(`Admin email sent ${reg.applicationId}: ${info.messageId}`);
    return { ok: true, at: new Date(), messageId: info.messageId };
  } catch (e) {
    logger.error(`Admin email error: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

export async function sendStatusUpdate(reg, newStatus, extras = {}) {
  if (!brevoConfigured()) return { ok: false, error: 'Brevo not configured' };
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
  const subject = extras.arn
    ? `ARN Generated — ${reg.applicationId} (${extras.arn}) | SS Tax Mentors`
    : `Status Update — ${reg.applicationId} is now ${newStatus} | SS Tax Mentors`;
  try {
    await sendViaBrevo({
      to: reg.email,
      replyTo: process.env.ADMIN_EMAIL,
      subject,
      html: `
        <div style="font-family:Inter,Arial;max-width:560px;margin:auto;padding:20px;background:#fff;border:1px solid #E5E7EB;border-radius:12px">
          <div style="background:#1A4FD6;color:#fff;padding:14px 18px;border-radius:8px">
            <h2 style="margin:0;font-family:Poppins,Arial">SS TAX MENTORS</h2>
          </div>
          <h3 style="color:#0B1B3A;margin-top:20px">Status Update: <span style="color:#1A4FD6">${newStatus}</span></h3>
          <p>Hi ${reg.applicantName},</p>
          <p>Your GST application <b>${reg.applicationId}</b> for <b>${reg.firmName}</b> has been updated.</p>
          ${extras.arn ? `<p><b>ARN:</b> ${extras.arn}</p>` : ''}
          ${extras.gstin ? `<p><b>GSTIN:</b> ${extras.gstin}</p>` : ''}
          <p style="margin:22px 0"><a href="${baseUrl}/track/${reg.applicationId}" style="display:inline-block;background:#1A4FD6;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">Track status</a></p>
          <p style="color:#6B7280;font-size:12px">Call +91 8179726723 for any queries.</p>
        </div>`,
    });
    return { ok: true, at: new Date() };
  } catch (e) {
    logger.error(`Status email error: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

export default { sendApplicantAcknowledgement, sendAdminNotification, sendStatusUpdate, verifyMailer };
