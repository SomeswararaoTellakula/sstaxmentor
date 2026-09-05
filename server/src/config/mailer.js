import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

let transporter = null;

export function configureMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass) {
    logger.warn('SMTP credentials missing — email delivery disabled');
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  transporter.verify().then(() => logger.info('SMTP verified')).catch((e) => logger.error('SMTP verify failed', e.message));
  return transporter;
}

export function getMailer() {
  if (!transporter) configureMailer();
  return transporter;
}

export default { configureMailer, getMailer };
