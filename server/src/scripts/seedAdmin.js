import 'dotenv/config';
import connectDB from '../config/db.js';
import AdminUser from '../models/AdminUser.js';
import logger from '../utils/logger.js';

async function seed() {
  await connectDB();
  const email = process.env.ADMIN_EMAIL_LOGIN || 'admin@sstaxmentors.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const existing = await AdminUser.findOne({ email });
  if (existing) {
    logger.info(`Admin ${email} already exists — updating password`);
    await existing.setPassword(password);
    existing.role = existing.role || 'superadmin';
    existing.name = existing.name || 'Super Admin';
    await existing.save();
  } else {
    const u = new AdminUser({ email, name: 'Super Admin', role: 'superadmin' });
    await u.setPassword(password);
    await u.save();
    logger.info(`Created admin ${email}`);
  }
  logger.info('Admin seed complete.');
  process.exit(0);
}

seed().catch((e) => {
  logger.error('Seed failed', e);
  process.exit(1);
});
