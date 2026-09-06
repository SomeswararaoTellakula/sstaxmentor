import { PDFDocument, StandardFonts, PDFName, rgb } from 'pdf-lib';
import logger from '../utils/logger.js';

const PAGE_W = 595.28;        // A4 width — keeps the deck a consistent width
const MAX_PAGE_H = 900;
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
 * Does this source page actually contain anything?
 *
 * Scanned and downloaded ID PDFs often carry several padding pages with no
 * drawing operations at all. A page counts as content if it references an
 * image XObject, or if its content stream is big enough to be real text.
 *
 * On any uncertainty we KEEP the page — dropping a client's document would be
 * far worse than leaving one blank sheet in.
 */
function pageHasContent(page) {
  try {
    const res = page.node.Resources();
    const xobjects = res?.lookup?.(PDFName.of('XObject'));
    if (xobjects?.keys && xobjects.keys().length > 0) return true;

    const fonts = res?.lookup?.(PDFName.of('Font'));
    const hasFonts = fonts?.keys && fonts.keys().length > 0;

    const contents = page.node.Contents();
    if (!contents) return false;

    let size = 0;
    if (typeof contents.getContentsSize === 'function') {
      size = contents.getContentsSize();
    } else if (typeof contents.contents?.length === 'number') {
      size = contents.contents.length;
    } else if (Array.isArray(contents)) {
      size = contents.length * 200;
    }

    // A truly blank page is usually a handful of bytes of setup operators.
    if (size > 250) return true;
    return hasFonts && size > 60;
  } catch {
    return true;
  }
}

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

        // Page is exactly as tall as the image needs — no dead space.
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

        // Keep only pages that actually carry something.
        const keep = [];
        const srcPages = src.getPages();
        srcPages.forEach((p, i) => { if (pageHasContent(p)) keep.push(i); });

        const skipped = srcPages.length - keep.length;
        if (skipped > 0) {
          logger.info(`PDF merge: skipped ${skipped} blank page(s) in ${key}`);
        }
        if (!keep.length) {
          logger.warn(`PDF merge: ${key} had no non-blank pages, keeping all`);
          keep.push(...srcPages.map((_, i) => i));
        }

        const pages = await out.copyPages(src, keep);
        pages.forEach((p, i) => {
          out.addPage(p);
          if (i === 0) {
            const { width, height } = p.getSize();
            p.drawRectangle({ x: 0, y: height - 26, width, height: 26, color: BLUE, opacity: 0.95 });
            p.drawText(label, { x: MARGIN, y: height - 18, size: 11, font, color: rgb(1, 1, 1) });
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
