const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const {
  loginLimiter,
  loginPerEmailLimiter,
  loginTwoFactorPerChallengeLimiter,
  registerLimiter,
  resendVerificationLimiter,
  passwordChangeLimiter,
  passwordResetLimiter,
  twoFactorLimiter,
  sessionsLimiter,
  accountDeletionLimiter,
} = require('../middleware/rateLimits');
const {
  register,
  login,
  loginTwoFactor,
  verifyEmail,
  resendVerification,
  refresh,
  logout,
  me,
  updateMe,
  deleteMe,
  requestPasswordChange,
  confirmPasswordChange,
  forgotPassword,
  resetPassword,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  listSessions,
  revokeSession,
  revokeOtherSessions,
} = require('../controllers/auth.controller');

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, loginPerEmailLimiter, login);
router.post(
  '/login/2fa',
  loginLimiter,
  loginTwoFactorPerChallengeLimiter,
  loginTwoFactor
);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, resendVerification);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authRequired, me);
router.patch('/me', authRequired, updateMe);
router.delete('/me', authRequired, accountDeletionLimiter, deleteMe);
router.post(
  '/change-password/request',
  authRequired,
  passwordChangeLimiter,
  requestPasswordChange
);
router.post(
  '/change-password/confirm',
  authRequired,
  passwordChangeLimiter,
  confirmPasswordChange
);

router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

router.post('/2fa/setup', authRequired, twoFactorLimiter, setupTwoFactor);
router.post('/2fa/enable', authRequired, twoFactorLimiter, enableTwoFactor);
router.post('/2fa/disable', authRequired, twoFactorLimiter, disableTwoFactor);

router.get('/sessions', authRequired, listSessions);
router.delete('/sessions', authRequired, sessionsLimiter, revokeOtherSessions);
router.delete('/sessions/:id', authRequired, sessionsLimiter, revokeSession);

module.exports = router;
