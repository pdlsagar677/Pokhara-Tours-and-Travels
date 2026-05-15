const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// express-rate-limit insists custom keyGenerators that fall back to `req.ip`
// go through `ipKeyGenerator(ip)` so IPv6 users hit a /56 subnet bucket rather
// than per-address (which they can trivially rotate). Wrap once for reuse.
function ipFallback(req) {
  return `ip:${ipKeyGenerator(req.ip)}`;
}

const standardOptions = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
};

const loginLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
});

// Per-account limiter. The IP-based loginLimiter alone leaves a single account
// open to distributed credential stuffing (many IPs each under the per-IP cap).
// Keying on the email body field forces all attempts at one account to share a
// single 5-per-15-min bucket regardless of IP. Falls back to IP if no email.
const loginPerEmailLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return email ? `email:${email}` : ipFallback(req);
  },
});

// Per-account limiter for the 2FA confirmation step. Keyed on the signed
// challenge-token string itself (treated as opaque) so the same enroled user
// is throttled across attempts even if IPs rotate.
const loginTwoFactorPerChallengeLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const challenge = String(req.body?.challengeToken || '').trim();
    return challenge ? `2fa:${challenge.slice(0, 64)}` : ipFallback(req);
  },
});

const registerLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 5,
});

const resendVerificationLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 3,
});

const passwordChangeLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 5,
});

const passwordResetLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 5,
});

const contactLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 5,
});

const newsletterLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 3,
});

const bookingCancelLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 5,
});

const esewaLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 30,
});

const twoFactorLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
});

const sessionsLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 30,
});

const accountDeletionLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 5,
});

const aiLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 1000,
  max: 20,
});

const aiChatLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 1000,
  max: 8,
});

// Per-user (or per-IP for anonymous) AI limiter. authOptional sets req.user
// when a valid Bearer token is presented; we key on that so a logged-in user
// opening many browser tabs still hits a shared quota and can't burn Gemini
// spend by parallelising. Anonymous traffic falls back to per-IP keying.
const aiLimiterPerUser = rateLimit({
  ...standardOptions,
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : ipFallback(req)),
});

const aiChatLimiterPerUser = rateLimit({
  ...standardOptions,
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : ipFallback(req)),
});

module.exports = {
  loginLimiter,
  loginPerEmailLimiter,
  loginTwoFactorPerChallengeLimiter,
  registerLimiter,
  resendVerificationLimiter,
  passwordChangeLimiter,
  passwordResetLimiter,
  contactLimiter,
  newsletterLimiter,
  bookingCancelLimiter,
  esewaLimiter,
  twoFactorLimiter,
  sessionsLimiter,
  accountDeletionLimiter,
  aiLimiter,
  aiChatLimiter,
  aiLimiterPerUser,
  aiChatLimiterPerUser,
};
