import axios from 'axios';
import logger from '../utils/logger.js';

export function getWhatsAppConfig() {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
    templates: {
      received: process.env.WA_TEMPLATE_RECEIVED || 'gst_registration_received',
      status: process.env.WA_TEMPLATE_STATUS || 'gst_status_update',
      arn: process.env.WA_TEMPLATE_ARN || 'gst_arn_generated',
    },
    adminWhatsApp: process.env.ADMIN_WHATSAPP,
  };
}

export function isWhatsAppConfigured() {
  const c = getWhatsAppConfig();
  return !!(c.phoneNumberId && c.accessToken);
}

export async function callWhatsAppGraph(body) {
  const c = getWhatsAppConfig();
  if (!isWhatsAppConfigured()) throw new Error('WhatsApp not configured');
  const url = `https://graph.facebook.com/${c.apiVersion}/${c.phoneNumberId}/messages`;
  const { data } = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${c.accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
  return data;
}

/*
* Alternative AiSensy adapter (commented to enable swap):
*
export async function sendViaAiSensy({ to, templateName, params, documentUrl }) {
*   const payload = {
*     apiKey: process.env.AISENSY_API_KEY,
*     campaignName: 'gst-reg',
*     destination: to,
*     userName: process.env.AISENSY_USERNAME,
*     templateParams: params,
*     templateName,
*     ...(documentUrl ? { attachment: { type: 'document', url: documentUrl } } : {}),
*   };
*   const { data } = await axios.post('https://backend.aisensy.com/campaign/t1/api/v2', payload, { timeout: 15000 });
*   return data;
* }
*/

export default { getWhatsAppConfig, isWhatsAppConfigured, callWhatsAppGraph };
