import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from './storageService.js';
import { maskAadhaar } from '../utils/encryption.js';
import { formatMobileDisplay } from '../utils/validators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_DIR = path.resolve(__dirname, '../../tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const BRAND = {
  blue: '#1A4FD6',
  navy: '#0B1B3A',
  muted: '#6B7280',
  line: '#E5E7EB',
  ok: '#16A34A',
};

function fmtIst(date) {
  return new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtIstDate(date) {
  return new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
}

function addHeader(doc, reg) {
  doc.rect(0, 0, doc.page.width, 68).fill(BRAND.blue);
  doc.fillColor('#FFFFFF');
  doc.font('Helvetica-Bold').fontSize(20).text('SS TAX MENTORS', 40, 22, { continued: false });
  doc.font('Helvetica-Oblique').fontSize(10).text('Reach Us & Relax', 40, 44);
  doc.font('Helvetica').fontSize(10);
  doc.text(`Application ID: ${reg.applicationId}`, doc.page.width - 280, 22, { width: 240, align: 'right' });
  doc.text(`Submitted: ${fmtIst(reg.createdAt)}`, doc.page.width - 280, 40, { width: 240, align: 'right' });
  doc.fillColor(BRAND.navy);
  doc.moveTo(40, 86).lineTo(doc.page.width - 40, 86).strokeColor(BRAND.line).lineWidth(0.5).stroke();
  return 96;
}

function addFooter(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const y = doc.page.height - 46;
    doc.fillColor(BRAND.muted).fontSize(8).font('Helvetica');
    doc.text('www.sstaxmentors.com', 40, y);
    doc.text('Call: +91 8179726723', 220, y, { width: 200, align: 'center' });
    doc.text('someshtellakula@gmail.com', 440, y);
    doc.text(`Page ${i + 1} of ${range.count}`, doc.page.width - 100, y + 14, { width: 60, align: 'right' });
    doc.moveTo(40, doc.page.height - 54).lineTo(doc.page.width - 40, doc.page.height - 54).strokeColor(BRAND.line).stroke();
    doc.fontSize(7).fillColor(BRAND.muted).text(
      'This is a computer-generated acknowledgement and is not a GST registration certificate.',
      40, doc.page.height - 24, { align: 'center', width: doc.page.width - 80 }
    );
  }
}

function sectionTitle(doc, y, title, ruleEndX) {
  doc.font('Helvetica-Bold').fontSize(13).fillColor(BRAND.navy).text(title, 40, y);
  const lineY = y + 18;
  doc.moveTo(40, lineY).lineTo(ruleEndX || doc.page.width - 40, lineY).strokeColor(BRAND.blue).lineWidth(1).stroke();
  return lineY + 14;
}

function fieldRow(doc, y, label, value) {
  const text = value || '—';
  const valueWidth = doc.page.width - 270;
  doc.font('Helvetica').fontSize(10);
  const labelH = doc.heightOfString(label, { width: 180 });
  doc.fillColor(BRAND.muted).text(label, 48, y, { width: 180 });
  doc.font('Helvetica-Bold').fontSize(10);
  const valueH = doc.heightOfString(text, { width: valueWidth });
  doc.fillColor(BRAND.navy).text(text, 230, y, { width: valueWidth });
  return y + Math.max(18, Math.max(labelH, valueH) + 6);
}

function _buildPdf(doc, reg, photoBuffer) {
  let y = addHeader(doc, reg);
  doc.font('Helvetica-Bold').fontSize(18).fillColor(BRAND.navy).text('GST Registration — Application Acknowledgement', 40, y, { width: doc.page.width - 80, align: 'center' });
  y += 36;

  y = sectionTitle(doc, y, '1. Applicant Details', photoBuffer ? 430 : null);
  if (photoBuffer) {
    try { doc.image(photoBuffer, doc.page.width - 150, y, { width: 80, height: 96, fit: [80, 96] }); } catch {}
  }
  y = fieldRow(doc, y, 'Applicant Name', reg.applicantName);
  y = fieldRow(doc, y, 'Mobile Number', formatMobileDisplay(reg.mobile));
  y = fieldRow(doc, y, 'Alternate Mobile', reg.altMobile ? formatMobileDisplay(reg.altMobile) : '—');
  y = fieldRow(doc, y, 'Email ID', reg.email);
  y += 6;

  y = sectionTitle(doc, y, '2. Business Details');
  y = fieldRow(doc, y, 'Firm / Business Name', reg.firmName);
  y = fieldRow(doc, y, 'Constitution', reg.businessType);
  y = fieldRow(doc, y, 'Nature of Business', reg.businessNature || '—');
  y = fieldRow(doc, y, 'Full Address', reg.firmAddress);
  y = fieldRow(doc, y, 'City', reg.city);
  y = fieldRow(doc, y, 'State', reg.state);
  y = fieldRow(doc, y, 'PIN Code', reg.pincode);
  y = fieldRow(doc, y, 'Premises Type', reg.premisesType);
  y = fieldRow(doc, y, 'PAN Number', reg.panNumber);
  const maskedAadhaar = reg.aadhaarLast4 ? `XXXX XXXX ${reg.aadhaarLast4}` : maskAadhaar('');
  y = fieldRow(doc, y, 'Aadhaar (Masked)', maskedAadhaar);
  y += 6;

  if (y > 620) { doc.addPage(); y = 80; }

  y = sectionTitle(doc, y, '3. Documents Received');
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND.muted);
  doc.text('Document', 48, y);
  doc.text('Received', 320, y);
  doc.text('File', 400, y);
  y += 14;
  doc.moveTo(48, y).lineTo(doc.page.width - 48, y).strokeColor(BRAND.line).stroke();
  y += 8;

  const docList = [
    ['Aadhaar Card', reg.documents?.aadhaarCard],
    ['PAN Card', reg.documents?.panCard],
    ['Passport Photo', reg.documents?.photo],
    ['Electricity Bill', reg.documents?.electricityBill],
    ['Rental Agreement', reg.documents?.rentalAgreement],
    ['Property Tax Receipt', reg.documents?.propertyTaxReceipt],
    ['Owner Aadhaar', reg.documents?.ownerAadhaarFile],
    ['Witness Aadhaar', reg.documents?.witnessAadhaarFile],
    ['Bank Proof', reg.documents?.bankProof],
  ];

  for (const [label, ref] of docList) {
    if (y > 760) { doc.addPage(); y = 80; }
    const got = !!ref;
    doc.font('Helvetica').fontSize(10).fillColor(BRAND.navy).text(label, 48, y);
    doc.fillColor(got ? BRAND.ok : BRAND.muted).font('Helvetica-Bold').text(got ? 'Yes' : 'No', 320, y, { width: 60 });
    doc.fillColor(BRAND.muted).font('Helvetica').fontSize(9).text(ref?.originalName || '', 400, y, { width: 140, ellipsis: true });
    y += 18;
  }
  y += 6;

  if (y > 700) { doc.addPage(); y = 80; }
  y = sectionTitle(doc, y, '4. Optional Details & Owner / Witness');
  y = fieldRow(doc, y, 'Owner Name', reg.ownerName || '—');
  y = fieldRow(doc, y, 'Owner Mobile', reg.ownerMobile ? formatMobileDisplay(reg.ownerMobile) : '—');
  y = fieldRow(doc, y, 'Witness Name', reg.witnessName || '—');
  y = fieldRow(doc, y, 'Witness Mobile', reg.witnessMobile ? formatMobileDisplay(reg.witnessMobile) : '—');
  y = fieldRow(doc, y, 'Remarks', reg.remarks || '—');
  y += 10;

  doc.rect(40, y, doc.page.width - 80, 0).stroke();
  const nextY = y + 4;
  doc.rect(40, nextY, doc.page.width - 80, 110).fillAndStroke('#F5F8FF', BRAND.line);
  doc.fillColor(BRAND.navy).font('Helvetica-Bold').fontSize(12).text('What happens next?', 56, nextY + 14);
  doc.font('Helvetica').fontSize(10);
  const steps = [
    '1. Our team verifies documents within 1 working day.',
    '2. Application is filed on the GST Portal.',
    '3. ARN is shared over email & WhatsApp.',
    '4. GSTIN is delivered on approval from GSTN.',
  ];
  let sy = nextY + 36;
  for (const s of steps) { doc.fillColor(BRAND.navy).text(s, 72, sy); sy += 18; }

  doc.addPage();
  doc.font('Helvetica-Oblique').fontSize(10).fillColor(BRAND.muted).text(
    `This acknowledgement is issued by SS Tax Mentors on ${fmtIstDate(reg.createdAt)}. Application ID ${reg.applicationId} is for internal tracking and does not constitute GST registration.`,
    40, 120, { width: doc.page.width - 80, align: 'center' }
  );

  addFooter(doc);
}

export async function generateAcknowledgementPdf(reg, photoBuffer = null) {
  const tmpFile = path.join(TMP_DIR, `${reg.applicationId}-${uuidv4()}.pdf`);
  const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `GST Acknowledgement ${reg.applicationId}`, Author: 'SS Tax Mentors' } });
  const stream = fs.createWriteStream(tmpFile);
  doc.pipe(stream);
  _buildPdf(doc, reg, photoBuffer);
  doc.end();
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  const uploaded = await uploadFile(tmpFile, `${reg.applicationId}-acknowledgement.pdf`, 'application/pdf', 'gst-pdfs');
  try { fs.unlinkSync(tmpFile); } catch {}
  return uploaded;
}

export function streamPdfToResponse(reg, photoBuffer = null, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `GST Acknowledgement ${reg.applicationId}`, Author: 'SS Tax Mentors' } });
  doc.pipe(res);
  _buildPdf(doc, reg, photoBuffer);
  doc.end();
}

export function streamPdfFromDisk(localPath) {
  return fs.createReadStream(localPath);
}

export default { generateAcknowledgementPdf, streamPdfToResponse };
