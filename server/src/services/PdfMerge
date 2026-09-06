import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import logger from '../utils/logger.js';

const A4 = [595.28, 841.89];
const NAVY = rgb(0.043, 0.106, 0.227);
const BLUE = rgb(0.102, 0.310, 0.839);

/** Documents appended to the client's PDF, in this order. */
export const APPENDED_DOCS = [
  { key: 'aadhaarCard', label: 'Aadhaar Card' },
  { key: 'panCard', label: 'PAN Card' },
  { key: 'electricityBill', label: 'Electricity Bill — Business Premises' },
];

function isImage(mime) {
  return /^image\/(jpe?g|png)$/i.test(mime || '');
}

/**
 * Append each supplied document to the acknowledgement PDF.
 *
 * Images become a full page with a heading. PDFs have their pages copied in
 * as-is. Anything that fails is skipped with a warning — a broken attachment
 * must never cost the client their acknowledgement.
 *
 * @param {Buffer} baseBuffer  the acknowledgement PDF from pdfkit
 * @param {Object} docBuffers  { aadhaarCard: { buffer, mimeType, originalName }, ... }
 * @returns {Promise<Buffer>}  merged PDF
 */
export async function appendDocumentsToPdf(baseBuffer, docBuffers = {}) {
  if (!docBuffers || !Object.keys(docBuffers).length) return baseBuffer;

  let out;
  try {
    out = await PDFDocument.load(baseBuffer);
  } catch (e) {
    logger.warn(`PDF merge skipped — base load failed: ${e.message}`);
    return baseBuffer;
  }

  const font = await out.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await out.embedFont(StandardFonts.Helvetica);

  for (const { key, label } of APPENDED_DOCS) {
    const doc = docBuffers[key];
    if (!doc?.buffer) continue;

    try {
      if (isImage(doc.mimeType)) {
        const img = /png$/i.test(doc.mimeType)
          ? await out.embedPng(doc.buffer)
          : await out.embedJpg(doc.buffer);

        const page = out.addPage(A4);
        const [pw, ph] = A4;

        // heading band
        page.drawRectangle({ x: 0, y: ph - 64, width: pw, height: 64, color: BLUE });
        page.drawText(label, {
          x: 40, y: ph - 40, size: 16, font, color: rgb(1, 1, 1),
        });
        page.drawText(doc.originalName || '', {
          x: 40, y: ph - 56, size: 9, font: fontRegular, color: rgb(0.85, 0.9, 1),
        });

        // fit the image inside the remaining area, preserving aspect ratio
        const maxW = pw - 80;
        const maxH = ph - 64 - 80;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        page.drawImage(img, {
          x: (pw - w) / 2,
          y: (ph - 64 - h) / 2 + 20,
          width: w,
          height: h,
        });
      } else if (/pdf$/i.test(doc.mimeType)) {
        const src = await PDFDocument.load(doc.buffer, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p, i) => {
          out.addPage(p);
          if (i === 0) {
            const { width, height } = p.getSize();
            // small corner label so the page is identifiable
            p.drawRectangle({
              x: width - 220, y: height - 26, width: 210, height: 20,
              color: BLUE, opacity: 0.92,
            });
            p.drawText(label, {
              x: width - 212, y: height - 21, size: 9, font, color: rgb(1, 1, 1),
            });
          }
        });
      } else {
        logger.warn(`PDF merge: unsupported type for ${key} (${doc.mimeType})`);
      }
    } catch (e) {
      logger.warn(`PDF merge: could not append ${key} — ${e.message}`);
    }
  }

  try {
    const bytes = await out.save();
    return Buffer.from(bytes);
  } catch (e) {
    logger.warn(`PDF merge save failed: ${e.message}`);
    return baseBuffer;
  }
}

export default { appendDocumentsToPdf, APPENDED_DOCS };
