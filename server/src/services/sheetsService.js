import { getSheetsClient, HEADERS } from '../config/sheets.js';
import logger from '../utils/logger.js';
import { getReadableUrl } from './storageService.js';
import { maskAadhaar } from '../utils/encryption.js';
import { formatMobileDisplay } from '../utils/validators.js';

function istStamp(date = new Date()) {
  const d = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return d.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function withBackoff(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      if (e?.code === 429) {
        const wait = Math.pow(2, i) * 1000 + Math.random() * 500;
        logger.warn(`Sheets 429 — retry ${i + 1} in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

async function ensureHeaderRow(sheets, spreadsheetId, range) {
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${range}!A1:ZZ1` });
    const rows = res.data.values || [];
    if (!rows.length || rows[0].length < 10) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${range}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [HEADERS] },
      });
    }
  } catch (e) {
    logger.warn('Header ensure failed, writing headers', e.message);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${range}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [HEADERS] },
    });
  }
}

function hyperlink(url, label = 'View') {
  if (!url) return '';
  return `=HYPERLINK("${url}","${label.replace(/"/g, '""')}")`;
}

async function findApplicationRow(sheets, spreadsheetId, tab, applicationId) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!B:B`,
  });
  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]?.[0] === applicationId) return i + 1;
  }
  return null;
}

export async function buildRegistrationRow(reg) {
  const docs = reg.documents || {};
  const [aadhaarDocUrl, panDocUrl, photoUrl, ebUrl, rentUrl, taxUrl, ownAadUrl, witAadUrl, bankUrl] = await Promise.all([
    getReadableUrl(docs.aadhaarCard),
    getReadableUrl(docs.panCard),
    getReadableUrl(docs.photo),
    getReadableUrl(docs.electricityBill),
    getReadableUrl(docs.rentalAgreement),
    getReadableUrl(docs.propertyTaxReceipt),
    getReadableUrl(docs.ownerAadhaarFile),
    getReadableUrl(docs.witnessAadhaarFile),
    getReadableUrl(docs.bankProof),
  ]);
  const masked = reg.aadhaarLast4 ? `XXXX XXXX ${reg.aadhaarLast4}` : maskAadhaar('');
  return [
    istStamp(reg.createdAt),
    reg.applicationId,
    reg.status,
    reg.applicantName,
    formatMobileDisplay(reg.mobile),
    reg.altMobile ? formatMobileDisplay(reg.altMobile) : '',
    reg.email,
    reg.firmName,
    reg.businessType,
    reg.businessNature || '',
    reg.firmAddress,
    reg.city,
    reg.state,
    reg.pincode,
    reg.premisesType,
    reg.panNumber,
    masked,
    hyperlink(aadhaarDocUrl, docs.aadhaarCard?.originalName || 'Aadhaar'),
    hyperlink(panDocUrl, docs.panCard?.originalName || 'PAN'),
    hyperlink(photoUrl, docs.photo?.originalName || 'Photo'),
    hyperlink(ebUrl, docs.electricityBill?.originalName || 'Electricity'),
    hyperlink(rentUrl, docs.rentalAgreement?.originalName || 'Rental'),
    hyperlink(taxUrl, docs.propertyTaxReceipt?.originalName || 'Property Tax'),
    reg.ownerName || '',
    reg.ownerMobile ? formatMobileDisplay(reg.ownerMobile) : '',
    hyperlink(ownAadUrl, docs.ownerAadhaarFile?.originalName || ''),
    reg.witnessName || '',
    reg.witnessMobile ? formatMobileDisplay(reg.witnessMobile) : '',
    hyperlink(witAadUrl, docs.witnessAadhaarFile?.originalName || ''),
    hyperlink(bankUrl, docs.bankProof?.originalName || ''),
    reg.remarks || '',
    hyperlink(reg.delivery?.pdfUrl || '', 'Download PDF'),
  ];
}

export async function appendRegistration(reg) {
  const sheets = getSheetsClient();
  if (!sheets) return { ok: false, error: 'Sheets not configured' };
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const tab = process.env.GOOGLE_SHEET_TAB || 'GST Registrations';
  try {
    return await withBackoff(async () => {
      await ensureHeaderRow(sheets, spreadsheetId, tab);
      const row = await buildRegistrationRow(reg);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tab}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
      return { ok: true, at: new Date() };
    });
  } catch (e) {
    logger.error('Sheets append error', e.message);
    return { ok: false, error: e.message };
  }
}

export async function updateStatus(applicationId, status, extra = {}) {
  const sheets = getSheetsClient();
  if (!sheets) return { ok: false, error: 'Sheets not configured' };
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const tab = process.env.GOOGLE_SHEET_TAB || 'GST Registrations';
  try {
    return await withBackoff(async () => {
      const rowNum = await findApplicationRow(sheets, spreadsheetId, tab, applicationId);
      if (!rowNum) return { ok: false, error: 'Row not found' };
      const updates = [['C', status]];
      if (extra.arn) updates.push(['AE', extra.arn]);
      if (extra.gstin) updates.push(['AF', extra.gstin]);
      const data = updates.map(([col, val]) => ({
        range: `${tab}!${col}${rowNum}`,
        values: [[val]],
      }));
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data,
        },
      });
      return { ok: true, at: new Date() };
    });
  } catch (e) {
    logger.error('Sheets update error', e.message);
    return { ok: false, error: e.message };
  }
}

export default { appendRegistration, updateStatus, buildRegistrationRow };
