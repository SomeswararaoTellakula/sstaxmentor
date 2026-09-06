import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import { configureSheets } from './config/sheets.js';
import { configureMailer } from './config/mailer.js';

import gstRoutes from './routes/gstRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { errorHandler, notFound } from './middleware/errorHandler.js';
import { retryFailedDeliveries } from './controllers/registrationController.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 5000);
const APP_BASE = process.env.APP_BASE_URL || 'http://localhost:5173';

const corsOrigins = [APP_BASE, 'http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.CORS_ORIGINS) {
  for (const o of process.env.CORS_ORIGINS.split(',')) corsOrigins.push(o.trim());
}

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'res.cloudinary.com'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        connectSrc: ["'self'", 'https://graph.facebook.com', 'https://sheets.googleapis.com', 'res.cloudinary.com'],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || corsOrigins.includes(origin) || origin.startsWith('http://localhost')) return cb(null, true);
    return cb(new Error(`CORS blocked ${origin}`));
  },
  credentials: true,
  maxAge: 86400,
}));

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(mongoSanitize());

app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads'), {
  maxAge: '1h',
  setHeaders(res) {
    res.setHeader('Content-Security-Policy', 'default-src \'none\'');
  },
}));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV, uptime: process.uptime() | 0 });
});

app.use('/api/gst', gstRoutes);
app.use('/api/admin', adminRoutes);

// serve the built client
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');
app.use(express.static(CLIENT_DIST));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  configureCloudinary();
  configureSheets();
  configureMailer();

  app.listen(PORT, () => {
    logger.info(`API listening on http://localhost:${PORT}`);
    logger.info(`Allowed origins: ${corsOrigins.join(', ')}`);
  });

  cron.schedule('*/15 * * * *', () => {
    retryFailedDeliveries().catch((e) => logger.error('Retry job error', e));
  });
}

start().catch((e) => {
  logger.error('Startup failed:', e);
  process.exit(1);
});

process.on('uncaughtException', (e) => {
  if (e.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} in use — kill with: lsof -ti :${PORT} | xargs kill -9`);
    process.exit(1);
  }
  throw e;
});

export default app;
