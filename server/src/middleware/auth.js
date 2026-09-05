import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';

export function signAdminToken(admin) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign(
    { sub: admin._id, email: admin.email, role: admin.role },
    secret,
    { expiresIn: '8h' }
  );
}

export function setAdminCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 8 * 3600 * 1000,
    path: '/',
  });
}

export function clearAdminCookie(res) {
  res.clearCookie('admin_token', { path: '/' });
}

export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.admin_token || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const decoded = jwt.verify(token, secret);
    const admin = await AdminUser.findById(decoded.sub).select('email role name');
    if (!admin) return res.status(401).json({ error: 'Admin not found' });
    req.admin = admin;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export default { requireAdmin, signAdminToken, setAdminCookie, clearAdminCookie };
