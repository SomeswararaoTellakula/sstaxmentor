import { PDFDocument, StandardFonts, PDFName, PDFDict, PDFRawStream, PDFArray, rgb } from 'pdf-lib';
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

function filterNames(dict) {
  const f = dict.get(PDFName.of('Filter'));
  if (!f) return [];
  if (f instanceof PDFArray) return f.asArray().map((x) => String(x));
  return [String(f)];
}

/**
 * Pull the largest embedded JPEG out of a source PDF page.
 *
 * Scans and downloaded ID PDFs are usually a single photo dropped onto a full
 * A4 sheet, which is where all the whitespace comes from. Lifting the photo
 * out lets us lay it on a page sized to the image, exactly as we do for a
 * direct JPEG upload.
 *
 * Returns { bytes, width, height } or null when the page isn't that shape.
 */
function extractLargestJpeg(srcDoc, page) {
  try {
    const res = page.node.Resources();
    if (!res) return null;
    const xobjs = res.lookup(PDFName.of('XObject'), PDFDict);
    if (!xobjs) return null;

    let best = null;
    for (const [, ref] of xobjs.entries()) {
      const stream = srcDoc.context.lookup(ref);
      if (!(stream instanceof PDFRawStream)) continue;
      const d = stream.dict;
      if (String(d.get(PDFName.of('Subtype'))) !== '/Image') continue;
      if (!filterNames(d).includes('/DCTDecode')) continue;   // JPEG only

      const w = Number(d.get(PDFName.of('Width'))?.asNumber?.() ?? 0);
      const h = Number(d.get(PDFName.of('Height'))?.asNumber?.() ?? 0);
      if (!w || !h) continue;
      if (!best || w * h > best.width * best.height) {
        best = { bytes: stream.contents, width: w, height: h };
      }
    }
    return best;
  } catch (e) {
    logger.warn(`PDF merge: image extract failed — ${e.message}`);
    return null;
  }
}

/** Draw an embedded image on a page sized to it. */
function addTightImagePage(out, img, label, subLabel, font, fontRegular) {
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

  const pageH = HEADER_H + h + MARGIN * 2;
  const page = out.addPage([PAGE_W, pageH]);

  page.drawRectangle({ x: 0, y: pageH - HEADER_H, width: PAGE_W, height: HEADER_H, color: BLUE });
  page.drawText(label, { x: MARGIN, y: pageH - 27, size: 13, font, color: rgb(1, 1, 1) });
  if (subLabel) {
    page.drawText(subLabel, { x: MARGIN, y: pageH - 39, size: 8, font: fontRegular, color: rgb(0.85, 0.9, 1) });
  }
  page.drawImage(img, { x: (PAGE_W - w) / 2, y: MARGIN, width: w, height: h });
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
        addTightImagePage(out, img, label, doc.originalName, font, fontRegular);
      } else if (/pdf$/i.test(doc.mimeType)) {
        const src = await PDFDocument.load(doc.buffer, { ignoreEncryption: true });
        const srcPages = src.getPages();

        let extracted = 0;
        const fallbackIdx = [];

        for (let i = 0; i < srcPages.length; i++) {
          const found = extractLargestJpeg(src, srcPages[i]);
          if (found) {
            try {
              const img = await out.embedJpg(found.bytes);
              addTightImagePage(
                out,
                img,
                srcPages.length > 1 ? `${label} (${i + 1}/${srcPages.length})` : label,
                doc.originalName,
                font,
                fontRegular
              );
              extracted++;
              continue;
            } catch (e) {
              logger.warn(`PDF merge: embed of extracted image failed — ${e.message}`);
            }
          }
          fallbackIdx.push(i);
        }

        // Pages we couldn't lift an image from get copied verbatim, so nothing
        // is ever lost — worst case they keep their original margins.
        if (fallbackIdx.length) {
          const copied = await out.copyPages(src, fallbackIdx);
          copied.forEach((p, n) => {
            out.addPage(p);
            if (extracted === 0 && n === 0) {
              const { width, height } = p.getSize();
              p.drawRectangle({ x: 0, y: height - 26, width, height: 26, color: BLUE, opacity: 0.95 });
              p.drawText(label, { x: MARGIN, y: height - 18, size: 11, font, color: rgb(1, 1, 1) });
            }
          });
        }

        logger.info(`PDF merge ${key}: ${extracted} page(s) tightened, ${fallbackIdx.length} copied as-is`);
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
