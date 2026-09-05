import { Router } from 'express';
import { registerSubmission, downloadPdf, trackApplication, registerValidators } from '../controllers/registrationController.js';
import { gstFields } from '../middleware/upload.js';
import { registerLimiter, trackLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post(
  '/register',
  registerLimiter,
  gstFields,
  registerValidators,
  registerSubmission
);

router.get('/track/:applicationId', trackLimiter, trackApplication);
router.get('/:applicationId/pdf', downloadPdf);

export default router;
