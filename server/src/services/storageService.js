import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { configureCloudinary, useCloudinary, getSignedCloudinaryUrl } from '../config/cloudinary.js';
import cloudinary from '../config/cloudinary.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });

const PUBLIC_LOCAL_DIR = path.resolve(__dirname, '../../public/uploads');
if (!fs.existsSync(PUBLIC_LOCAL_DIR)) fs.mkdirSync(PUBLIC_LOCAL_DIR, { recursive: true });

function isImage(mime) {
  return /^image\/(jpe?g|png)$/i.test(mime || '');
}

async function stripExifAndCopy(localPath, mime) {
  if (!isImage(mime)) return localPath;
  try {
    const out = `${localPath}.clean${path.extname(localPath) || '.bin'}`;
    await sharp(localPath).rotate().toFile(out);
    if (fs.existsSync(out)) {
      fs.unlinkSync(localPath);
      fs.renameSync(out, localPath);
    }
  } catch (e) {
    logger.warn('Exif strip failed', e.message);
  }
  return localPath;
}

export async function uploadFile(localPath, originalName, mimeType, folder = 'gst-docs') {
  await stripExifAndCopy(localPath, mimeType);
  if (!fs.existsSync(localPath)) throw new Error(`File not found at path: ${localPath}`);
  const sizeBytes = fs.statSync(localPath).size;
  if (sizeBytes === 0) throw new Error(`File is empty: ${localPath}`);
  const ext = path.extname(originalName) || (mimeType === 'application/pdf' ? '.pdf' : mimeType === 'image/png' ? '.png' : '.jpg');
  if (useCloudinary()) {
    configureCloudinary();
    const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
    const publicId = `${uuidv4()}-${Date.now()}`;
    let uploaded;
    try {
      uploaded = await cloudinary.uploader.upload(localPath, {
        public_id: publicId,
        resource_type: resourceType,
        folder,
      });
    } catch (e) {
      logger.error(`Cloudinary upload failed: ${e.message} | http_code=${e.http_code} | cloud=${process.env.CLOUDINARY_CLOUD_NAME}`);
      throw e;
    }
    try { fs.unlinkSync(localPath); } catch {}
    return {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      originalName,
      mimeType,
      sizeBytes,
      uploadedAt: new Date(),
    };
  }
  const safeName = `${uuidv4()}-${Date.now()}${ext}`;
  const dest = path.join(PUBLIC_LOCAL_DIR, safeName);
  fs.copyFileSync(localPath, dest);
  try { fs.unlinkSync(localPath); } catch {}
  return {
    url: `/uploads/${safeName}`,
    publicId: safeName,
    originalName,
    mimeType,
    sizeBytes,
    uploadedAt: new Date(),
  };
}

export async function getReadableUrl(fileRef) {
  if (!fileRef) return null;
  if (useCloudinary() && fileRef.publicId) {
    return getSignedCloudinaryUrl(fileRef.publicId, {
      resource_type: fileRef.mimeType === 'application/pdf' ? 'raw' : 'image',
    });
  }
  return `${process.env.API_BASE_URL || ''}${fileRef.url}`;
}

export async function deleteFile(fileRef) {
  if (!fileRef) return;
  try {
    if (useCloudinary() && fileRef.publicId) {
      configureCloudinary();
      const rt = fileRef.mimeType === 'application/pdf' ? 'raw' : 'image';
      await cloudinary.uploader.destroy(fileRef.publicId, { resource_type: rt });
    } else if (fileRef.publicId) {
      const p = path.join(PUBLIC_LOCAL_DIR, fileRef.publicId);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  } catch (e) {
    logger.warn('Delete file failed', e.message);
  }
}

export default { uploadFile, getReadableUrl, deleteFile };
