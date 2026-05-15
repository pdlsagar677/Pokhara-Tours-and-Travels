const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const maintenanceCheck = require('./middleware/maintenanceCheck');

const app = express();

app.set('trust proxy', 1);

// CSP off: Next.js's exported HTML uses inline runtime scripts that helmet's
// strict default CSP would block. Other helmet protections stay on.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// Custom morgan URL token that redacts credential-like query params so they
// don't end up in persistent access logs (stdout, file rotation, log aggregator).
// `/verify-email?token=…`, `/reset-password?token=…`, eSewa redirects, etc.
// all carry single-use credentials that must not be logged verbatim.
const REDACTED_QUERY_KEYS = new Set([
  'token',
  'code',
  'otp',
  'secret',
  'signature',
  'data', // eSewa returns the entire signed payload as `?data=…`
]);
morgan.token('safe-url', (req) => {
  const original = req.originalUrl || req.url || '';
  const qIndex = original.indexOf('?');
  if (qIndex === -1) return original;
  const pathname = original.slice(0, qIndex);
  const params = new URLSearchParams(original.slice(qIndex + 1));
  let mutated = false;
  for (const key of params.keys()) {
    if (REDACTED_QUERY_KEYS.has(key.toLowerCase())) {
      params.set(key, '[REDACTED]');
      mutated = true;
    }
  }
  return mutated ? `${pathname}?${params.toString()}` : original;
});

const PROD_FORMAT =
  ':remote-addr - :remote-user [:date[clf]] ":method :safe-url HTTP/:http-version"' +
  ' :status :res[content-length] ":referrer" ":user-agent"';
const DEV_FORMAT = ':method :safe-url :status :response-time ms - :res[content-length]';

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? PROD_FORMAT : DEV_FORMAT));
}

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok', service: 'pokhara-tours-api' } });
});

// Maintenance gate applies only to API traffic. Static HTML pages must still
// load during maintenance so users can see the maintenance message rendered
// by the frontend from the API's 503 response.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return maintenanceCheck(req, res, next);
  return next();
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/destinations', require('./routes/destinations.routes'));
app.use('/api/packages', require('./routes/packages.routes'));
app.use('/api/bookings', require('./routes/bookings.routes'));
app.use('/api/contact', require('./routes/contact.routes'));
app.use('/api/newsletter', require('./routes/newsletter.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/ai', require('./routes/ai.routes'));

// JSON 404 for unmatched API routes; non-/api routes fall through to static.
app.use('/api', notFound);

// Static frontend (Next.js `output: 'export'` build). With `trailingSlash: true`
// each route is exported as <route>/index.html, which express.static serves
// natively.
const FRONTEND_OUT = path.resolve(__dirname, '../../frontend/out');
app.use(
  express.static(FRONTEND_OUT, {
    extensions: ['html'],
    index: 'index.html',
    maxAge: '1h',
  })
);

// Unknown non-/api GET → serve Next's exported 404.html so users see the
// styled error page instead of a blank Express default.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  return res.status(404).sendFile(path.join(FRONTEND_OUT, '404.html'), (err) => {
    if (err) next(err);
  });
});

app.use(errorHandler);

module.exports = app;
