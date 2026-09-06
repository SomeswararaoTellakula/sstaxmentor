import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import logger from '../utils/logger.js';

const PAGE_W = 595.28;        // A4 width — keeps the deck a consistent width
const MAX_PAGE_H = 900;       // don't let a very tall scan run away
const HEADER_H = 44;
const MARGIN = 18;
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
 * Image pages are sized to the image itself rather than padded out to A4, so
 * there is no dead space above and below the scan. PDF documents have their
 * pages copied in as-is — their own margins come from the source file and
 * cannot be trimmed safely without knowing where the content sits.
 *
 * Any document that fails is skipped with a warning; a bad attachment must
 * never cost the client their acknowledgement.
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

        // Fit to the page width first, then clamp if that makes it too tall.
        const availW = PAGE_W - MARGIN * 2;
        let scale = availW / img.width;
        let w = img.width * scale;
        let h = img.height * scale;

        const maxImgH = MAX_PAGE_H - HEADER_H - MARGIN * 2;
        if (h > maxImgH) {
          scale = maxImgH / img.height;
          w = img.width * scale;
          h = img.height * scale;
        }

        // Page is exactly as tall as it needs to be — no empty space.
        const pageH = HEADER_H + h + MARGIN * 2;
        const page = out.addPage([PAGE_W, pageH]);

        page.drawRectangle({ x: 0, y: pageH - HEADER_H, width: PAGE_W, height: HEADER_H, color: BLUE });
        page.drawText(label, { x: MARGIN, y: pageH - 27, size: 13, font, color: rgb(1, 1, 1) });
        page.drawText(doc.originalName || '', {
          x: MARGIN, y: pageH - 39, size: 8, font: fontRegular, color: rgb(0.85, 0.9, 1),
        });

        page.drawImage(img, { x: (PAGE_W - w) / 2, y: MARGIN, width: w, height: h });
      } else if (/pdf$/i.test(doc.mimeType)) {
        const src = await PDFDocument.load(doc.buffer, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p, i) => {
          out.addPage(p);
          if (i === 0) {
            const { width, height } = p.getSize();
            p.drawRectangle({
              x: 0, y: height - 26, width, height: 26, color: BLUE, opacity: 0.95,
            });
            p.drawText(label, {
              x: MARGIN, y: height - 18, size: 11, font, color: rgb(1, 1, 1),
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
