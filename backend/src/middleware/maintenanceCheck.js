const Settings = require('../models/Settings');
const { verifyAccessToken } = require('../utils/tokens');

const EXEMPT_PREFIXES = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/admin',
  '/api/settings',
];

function isExempt(path) {
  return EXEMPT_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

// Cheap inline JWT decode so we don't need to mount authOptional everywhere.
// Returns the role or null if no/invalid token.
function readRole(req) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    return payload.role || null;
  } catch {
    return null;
  }
}

// 30-second cache of the settings doc so transient Mongo errors don't fail
// every single request, and so the gate is fast on the hot path. Pattern
// matches the dashboard cache in admin.controller.js.
let cached = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30 * 1000;

async function loadSettings() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return { settings: cached, stale: false };
  try {
    const fresh = await Settings.getSingleton();
    cached = fresh;
    cachedAt = now;
    return { settings: fresh, stale: false };
  } catch (err) {
    // Failed to fetch fresh — fall back to the most recent cached value if any.
    if (cached) return { settings: cached, stale: true };
    throw err;
  }
}

async function maintenanceCheck(req, res, next) {
  if (isExempt(req.path)) return next();

  let settings;
  try {
    ({ settings } = await loadSettings());
  } catch (err) {
    // No cached value AND fresh read failed. Fail closed for non-exempt traffic
    // so we don't accidentally serve under-maintenance endpoints (e.g. during
    // a Mongo outage right when a migration is running). Admin paths are
    // already covered by EXEMPT_PREFIXES above so recovery stays possible.
    console.warn('maintenanceCheck: settings load failed:', err.message);
    return res.status(503).json({
      error: 'Service temporarily unavailable. Please try again shortly.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  if (!settings.maintenanceMode) return next();

  const role = readRole(req);
  if (role === 'admin') return next();

  return res.status(503).json({
    error:
      settings.maintenanceMessage ||
      'Service temporarily unavailable. Please try again shortly.',
    code: 'MAINTENANCE',
  });
}

// Exported for tests / future cache-bust sites (e.g. when an admin updates
// the settings doc from /api/admin/settings).
function bustMaintenanceCache() {
  cached = null;
  cachedAt = 0;
}

module.exports = maintenanceCheck;
module.exports.bustMaintenanceCache = bustMaintenanceCache;
