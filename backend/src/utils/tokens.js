const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function signAccessToken(user, sessionId) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      sid: sessionId ? sessionId.toString() : undefined,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function signRefreshToken(user, sessionId) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      sid: sessionId ? sessionId.toString() : undefined,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function signTwoFactorChallengeToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), purpose: '2fa' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '5m' }
  );
}

function verifyTwoFactorChallengeToken(token) {
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  if (payload.purpose !== '2fa') {
    throw new Error('Invalid challenge purpose');
  }
  return payload;
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function hashToken(token) {
  return bcrypt.hash(token, 12);
}

function compareTokenHash(token, hash) {
  return bcrypt.compare(token, hash);
}

const isProd = () => process.env.NODE_ENV === 'production';

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd(),
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  signTwoFactorChallengeToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyTwoFactorChallengeToken,
  hashToken,
  compareTokenHash,
  refreshCookieOptions,
};
