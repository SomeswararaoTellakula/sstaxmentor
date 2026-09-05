import { Router } from 'express';
import {
  adminLogin, adminLogout, adminMe,
  listRegistrations, getRegistrationDetail, updateRegistration,
  resendChannel, exportCsv, adminStats, deleteRecord,
} from '../controllers/adminController.js';
import { loginValidators } from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', loginLimiter, loginValidators, adminLogin);
router.post('/logout', adminLogout);
router.get('/me', requireAdmin, adminMe);

router.get('/stats', requireAdmin, adminStats);
router.get('/registrations', requireAdmin, listRegistrations);
router.get('/registrations/export', requireAdmin, exportCsv);
router.get('/registrations/:id', requireAdmin, getRegistrationDetail);
router.patch('/registrations/:id', requireAdmin, updateRegistration);
router.post('/registrations/:id/resend', requireAdmin, resendChannel);
router.delete('/registrations/:id', requireAdmin, deleteRecord);

export default router;
