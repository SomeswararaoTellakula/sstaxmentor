import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const redact = (info) => {
  try {
    if (info.message && typeof info.message === 'string') {
      info.message = info.message.replace(/\b\d{12}\b/g, 'XXXXXXXXXXXX').replace(/\b\d{10}\b(?=@)/, 'XXXXXXXXXX');
    }
  } catch {}
  return info;
};

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    winston.format((info) => redact(info))(),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
