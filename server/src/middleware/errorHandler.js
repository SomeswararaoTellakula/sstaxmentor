import logger from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  if (err) {
    logger.error(`${req.method} ${req.path} -> ${err.name}: ${err.message}`);
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (err?.name === 'PayloadTooLargeError') {
    return res.status(413).json({ error: 'Request too large' });
  }
  if (err?.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}`, code: err.code });
  }
  if (err && /Invalid file|Disallowed|Multer/.test(err.message || '')) {
    return res.status(400).json({ error: err.message });
  }
  if (err?.name === 'ValidationError') {
    const issues = {};
    for (const [k, v] of Object.entries(err.errors || {})) issues[k] = v.message;
    return res.status(400).json({ error: 'Validation failed', issues });
  }
  if (err?.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate record' });
  }
  const status = err?.status || err?.statusCode || 500;
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : (err?.message || 'Error'),
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

export default errorHandler;
