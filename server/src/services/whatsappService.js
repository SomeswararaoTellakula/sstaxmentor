import { callWhatsAppGraph, getWhatsAppConfig, isWhatsAppConfigured } from '../config/whatsapp.js';
import logger from '../utils/logger.js';
import { normalizeIndianMobile } from '../utils/validators.js';
import { getReadableUrl } from './storageService.js';

async function sendTemplate({ to, templateName, params = [], documentUrl = null, buttonUrl = null, buttonParam = null }) {
  if (!isWhatsAppConfigured()) return { ok: false, error: 'WhatsApp not configured' };
  const normalizedTo = normalizeIndianMobile(to);
  if (!/^\d{12}$/.test(normalizedTo)) return { ok: false, error: 'Invalid recipient number' };

  const bodyParams = (params || []).map((p) => ({ type: 'text', text: String(p) }));
  const components = [
    { type: 'body', parameters: bodyParams },
  ];
  if (documentUrl) {
    components.unshift({
      type: 'header',
      parameters: [{
        type: 'document',
        document: {
          link: documentUrl,
          filename: 'Acknowledgement.pdf',
        },
      }],
    });
  }
  if (buttonUrl || buttonParam) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: buttonParam ? [{ type: 'text', text: buttonParam }] : [{ type: 'text', text: '' }],
    });
  }

  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedTo,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US', policy: 'deterministic' },
        components,
      },
    };
    const res = await callWhatsAppGraph(payload);
    const wamid = res?.messages?.[0]?.id;
    logger.info(`WA sent ${normalizedTo} wamid=${wamid || 'none'}`);
    return { ok: true, at: new Date(), wamid };
  } catch (e) {
    const msg = e?.response?.data?.error?.message || e.message;
    logger.error(`WA failed to ${normalizedTo}: ${msg}`);
    return { ok: false, error: msg };
  }
}

export async function sendRegistrationReceived(reg, pdfFileRef, trackBase) {
  const cfg = getWhatsAppConfig();
  const pdfUrl = pdfFileRef ? (await getReadableUrl(pdfFileRef)) : null;
  const buttonParam = reg.applicationId;
  return sendTemplate({
    to: reg.mobile,
    templateName: cfg.templates.received,
    params: [reg.applicantName, reg.applicationId, reg.firmName],
    documentUrl: pdfUrl,
    buttonParam,
  });
}

export async function sendStatusUpdate(reg, newStatus) {
  const cfg = getWhatsAppConfig();
  return sendTemplate({
    to: reg.mobile,
    templateName: cfg.templates.status,
    params: [reg.applicantName, reg.applicationId, newStatus],
  });
}

export async function sendArnGenerated(reg, arn) {
  const cfg = getWhatsAppConfig();
  return sendTemplate({
    to: reg.mobile,
    templateName: cfg.templates.arn,
    params: [reg.applicantName, arn, reg.applicationId],
  });
}

export async function sendAdminNotification(reg) {
  const cfg = getWhatsAppConfig();
  if (!cfg.adminWhatsApp) return { ok: false, error: 'No ADMIN_WHATSAPP' };
  if (!isWhatsAppConfigured()) return { ok: false, error: 'WhatsApp not configured' };
  try {
    const res = await callWhatsAppGraph({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cfg.adminWhatsApp,
      type: 'text',
      text: {
        preview_url: false,
        body: `🔔 New GST Registration\n\nID: ${reg.applicationId}\nFirm: ${reg.firmName}\nApplicant: ${reg.applicantName}\nMobile: ${reg.mobile}\nEmail: ${reg.email}\nCity: ${reg.city}, ${reg.state}`,
      },
    });
    return { ok: true, at: new Date(), wamid: res?.messages?.[0]?.id };
  } catch (e) {
    logger.error(`WA admin error: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

export default { sendRegistrationReceived, sendStatusUpdate, sendArnGenerated, sendAdminNotification };
