import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

const noop = (_req, _res, next) => next();

export const registerLimiter = isDev
  ? noop
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many registration attempts. Try again after 1 hour.' },
      keyGenerator: (req) => req.ip,
    });

export const loginLimiter = isDev
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many login attempts. Try again after 15 minutes.' },
    });

export const trackLimiter = isDev
  ? noop
  : rateLimit({
      windowMs: 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
    });

export default { registerLimiter, loginLimiter, trackLimiter };
