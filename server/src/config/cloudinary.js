import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

let configured = false;

export function configureCloudinary() {
  if (configured) return cloudinary;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
    logger.info('Cloudinary configured');
  } else {
    logger.warn('Cloudinary credentials missing — using local file storage fallback');
  }
  return cloudinary;
}

export function useCloudinary() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export function getSignedCloudinaryUrl(publicId, opts = {}) {
  if (!configured) configureCloudinary();
  return cloudinary.url(publicId, {
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
    ...opts,
  });
}

export default cloudinary;
