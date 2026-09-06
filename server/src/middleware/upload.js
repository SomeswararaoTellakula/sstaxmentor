import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { fileTypeFromBuffer } from 'file-type';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMP_DIR = process.env.NODE_ENV === 'production' ? '/tmp/sstax-uploads' : path.resolve(__dirname, '../../tmp/uploads');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const MAX_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 5);
const MAX_FILES = 12;
const ALLOWED_MIME = new Set(['image/jpeg','image/jpg','image/png','application/pdf']);
const ALLOWED_EXT = new Set(['.jpg','.jpeg','.png','.pdf']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TMP_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
  },
});

function fileFilter(req, file, cb) {
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
    files: MAX_FILES,
    fieldSize: MAX_SIZE_MB * 1024 * 1024,
  },
});

const DOC_FIELDS = [
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'electricityBill', maxCount: 1 },
  { name: 'rentalAgreement', maxCount: 1 },
  { name: 'propertyTaxReceipt', maxCount: 1 },
  { name: 'ownerAadhaarFile', maxCount: 1 },
  { name: 'witnessAadhaarFile', maxCount: 1 },
  { name: 'bankProof', maxCount: 1 },
];

export const gstFields = upload.fields(DOC_FIELDS);

export async function validateRealMime(req, res, next) {
  const files = req.files || {};
  try {
    for (const k of Object.keys(files)) {
      const arr = Array.isArray(files[k]) ? files[k] : [files[k]];
      for (const f of arr) {
        const buf = fs.readFileSync(f.path);
        const head = buf.slice(0, 4100);
        // PDF: check magic bytes manually (file-type lib doesn't support PDF)
        if (head.slice(0, 4).toString('ascii') === '%PDF') {
          f.detectedMime = 'application/pdf';
          continue;
        }
        // Images: use file-type detection
        const detected = await fileTypeFromBuffer(head);
        if (detected && ALLOWED_MIME.has(detected.mime)) {
          f.detectedMime = detected.mime;
          continue;
        }
        // Fallback: trust multer's extension-based filter
        f.detectedMime = f.mimetype || 'application/octet-stream';
      }
    }
    next();
  } catch (e) {
    next(); // don't block submission on detection errors
  }
}

export function cleanupUploaded(req) {
  const files = req.files || {};
  for (const k of Object.keys(files)) {
    const arr = Array.isArray(files[k]) ? files[k] : [files[k]];
    for (const f of arr) {
      try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch {}
    }
  }
}

export default upload;
