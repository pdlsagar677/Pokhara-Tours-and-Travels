const User = require('../models/User');
const { verifyAccessToken } = require('../utils/tokens');

// Validate that the access token's `sid` claim still maps to an active session
// in `User.sessions[]`. Without this check the 15-min access JWT survives logout,
// password reset, and per-device session revoke — a stolen token stays usable
// until natural expiry. Returns the matched session sub-doc, or null if the
// token has no sid (legacy/pre-sessions tokens — kept for graceful migration).
async function findActiveSession(payload) {
  if (!payload?.sub) return null;
  if (!payload.sid) return null; // legacy access token — caller decides policy
  const user = await User.findById(payload.sub).select('+sessions');
  if (!user) return null;
  const session = user.sessions.id(payload.sid);
  if (!session) return null;
  // Best-effort lastUsedAt bump; failure here must not break the request.
  session.lastUsedAt = new Date();
  user.save().catch(() => {});
  return session;
}

async function authRequired(req, _res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    const err = new Error('Authentication required');
    err.status = 401;
    return next(err);
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    const err = new Error('Invalid or expired token');
    err.status = 401;
    return next(err);
  }

  try {
    if (payload.sid) {
      const session = await findActiveSession(payload);
      if (!session) {
        const err = new Error('Session revoked or expired');
        err.status = 401;
        return next(err);
      }
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sid: payload.sid || null,
    };
    next();
  } catch (err) {
    next(err);
  }
}

async function authOptional(req, _res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next();
  }
  try {
    if (payload.sid) {
      const session = await findActiveSession(payload);
      if (!session) return next(); // treat sid-mismatch as anonymous
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sid: payload.sid || null,
    };
    next();
  } catch {
    next();
  }
}

function adminOnly(req, _res, next) {
  if (req.user?.role !== 'admin') {
    const err = new Error('Admin access required');
    err.status = 403;
    return next(err);
  }
  next();
}

module.exports = { authRequired, authOptional, adminOnly };
