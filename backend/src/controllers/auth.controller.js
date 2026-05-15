const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { generateSecret, verify: totpVerify, generateURI } = require('otplib');
const UAParser = require('ua-parser-js');

const User = require('../models/User');
const Booking = require('../models/Booking');
const {
  sendVerificationEmail,
  sendPasswordChangeOtp,
  sendPasswordResetEmail,
  sendTwoFactorEnabledNotice,
  sendTwoFactorDisabledNotice,
} = require('../utils/mailer');
const { isEmail, isUsername, isPhone, passwordIssues } = require('../utils/validators');
const {
  signAccessToken,
  signRefreshToken,
  signTwoFactorChallengeToken,
  verifyRefreshToken,
  verifyTwoFactorChallengeToken,
  hashToken,
  compareTokenHash,
  refreshCookieOptions,
} = require('../utils/tokens');

const VERIFY_TOKEN_TTL_HOURS = parseInt(process.env.EMAIL_VERIFY_TTL_HOURS, 10) || 24;
const VERIFY_TOKEN_TTL_MS = VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000;
const PASSWORD_OTP_TTL_MIN = 10;
const PASSWORD_OTP_TTL_MS = PASSWORD_OTP_TTL_MIN * 60 * 1000;
const PASSWORD_RESET_TTL_MIN = 60;
const PASSWORD_RESET_TTL_MS = PASSWORD_RESET_TTL_MIN * 60 * 1000;

// Constant-time login: bcrypt.compare is always called, even for unknown
// emails, so response timing does not reveal which addresses are registered.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  '__no_user_dummy_password__',
  12
);
const TOTP_ENROLLMENT_TTL_MS = 10 * 60 * 1000;
const MAX_SESSIONS_PER_USER = 10;

async function verifyTotp(secret, token) {
  try {
    const result = await totpVerify({ secret, token });
    return Boolean(result?.valid);
  } catch {
    return false;
  }
}

function deviceLabelFor(userAgent) {
  if (!userAgent) return 'Unknown device';
  try {
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Browser';
    const os = parser.getOS().name || 'Unknown OS';
    return `${browser} on ${os}`;
  } catch {
    return 'Unknown device';
  }
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.ip || '';
}

/**
 * Adds a new session to user.sessions, signs the refresh token bound to it,
 * stores its bcrypt hash, prunes oldest sessions over the cap, and writes
 * the refresh cookie. Returns the access token (also bound to the session).
 */
async function issueSessionAndReturnAccess(user, req, res) {
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);
  const ipAddress = clientIp(req).slice(0, 64);
  const deviceLabel = deviceLabelFor(userAgent);

  if (!user.sessions) {
    user.sessions = [];
  }

  const session = user.sessions.create({
    refreshTokenHash: 'placeholder',
    userAgent,
    ipAddress,
    deviceLabel,
    createdAt: new Date(),
    lastUsedAt: new Date(),
  });
  user.sessions.push(session);

  const refreshToken = signRefreshToken(user, session._id);
  session.refreshTokenHash = await hashToken(refreshToken);

  if (user.sessions.length > MAX_SESSIONS_PER_USER) {
    user.sessions.sort(
      (a, b) => new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime()
    );
    while (user.sessions.length > MAX_SESSIONS_PER_USER) {
      user.sessions.shift();
    }
  }

  await user.save();

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return signAccessToken(user, session._id);
}

async function generateAndSendVerification(user) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.emailVerifyTokenHash = await bcrypt.hash(rawToken, 12);
  user.emailVerifyTokenExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
  await user.save();

  const base = process.env.CLIENT_URL || 'http://localhost:3000';
  const verifyUrl = `${base}/verify-email?token=${rawToken}&id=${user._id.toString()}`;
  await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
}

async function register(req, res, next) {
  try {
    const name = (req.body?.name || '').trim();
    const username = (req.body?.username || '').trim().toLowerCase();
    const email = (req.body?.email || '').trim().toLowerCase();
    const phone = (req.body?.phone || '').trim();
    const password = req.body?.password || '';

    if (!name || !username || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, username, email, phone and password are required' });
    }
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Name must be 2-100 characters' });
    }
    if (!isUsername(username)) {
      return res.status(400).json({ error: 'Username must be 3-30 characters, lowercase letters, numbers or underscores only' });
    }
    if (!isEmail(email) || email.length > 200) return res.status(400).json({ error: 'Enter a valid email' });
    if (!isPhone(phone)) return res.status(400).json({ error: 'Enter a valid phone number' });
    if (password.length > 256) {
      return res.status(400).json({ error: 'Password must be 256 characters or fewer' });
    }

    const pwdIssues = passwordIssues(password);
    if (pwdIssues.length > 0) {
      return res.status(400).json({ error: `Password must ${pwdIssues.join(', ')}` });
    }

    const verifiedConflict = await User.findOne({
      isEmailVerified: true,
      $or: [{ email }, { username }, { phone }],
    });
    if (verifiedConflict) {
      let field = 'identifier';
      if (verifiedConflict.email === email) field = 'email';
      else if (verifiedConflict.username === username) field = 'username';
      else if (verifiedConflict.phone === phone) field = 'phone';
      return res.status(409).json({ error: `This ${field} is already registered` });
    }

    await User.deleteMany({
      isEmailVerified: false,
      $or: [{ email }, { username }, { phone }],
    });

    const user = new User({ name, username, email, phone });
    await user.setPassword(password);
    await user.save();

    try {
      await generateAndSendVerification(user);
    } catch (mailErr) {
      await User.deleteOne({ _id: user._id });
      console.error('sendVerificationEmail failed:', mailErr.message);
      return res.status(502).json({
        error: 'Could not send verification email. Please try again.',
      });
    }

    res.status(201).json({
      data: {
        user: user.toPublic(),
        requiresEmailVerification: true,
        message: 'Account created. Please check your email to verify your account before signing in.',
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'identifier';
      return res.status(409).json({ error: `This ${field} is already registered` });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password || '';
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select(
      '+passwordHash +totpSecret +sessions'
    );

    // Always run a bcrypt compare so missing-email and wrong-password paths
    // take the same wall time. When the user doesn't exist we compare against
    // a fixed dummy hash; the result is discarded. See DUMMY_PASSWORD_HASH.
    const passwordOk = user
      ? await user.verifyPassword(password)
      : (await bcrypt.compare(password, DUMMY_PASSWORD_HASH), false);

    if (!user || !passwordOk) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before signing in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    if (user.totpSecret) {
      const challengeToken = signTwoFactorChallengeToken(user);
      return res.json({
        data: { require2fa: true, challengeToken },
      });
    }

    const accessToken = await issueSessionAndReturnAccess(user, req, res);
    res.json({ data: { user: user.toPublic(), accessToken } });
  } catch (err) {
    next(err);
  }
}

async function loginTwoFactor(req, res, next) {
  try {
    const challengeToken = String(req.body?.challengeToken || '').trim();
    const code = String(req.body?.code || '').trim();

    if (!challengeToken || !code) {
      return res.status(400).json({ error: 'Challenge token and code are required' });
    }

    let payload;
    try {
      payload = verifyTwoFactorChallengeToken(challengeToken);
    } catch {
      return res.status(401).json({ error: 'Challenge expired. Please sign in again.' });
    }

    const user = await User.findById(payload.sub).select(
      '+totpSecret +totpBackupCodesHash +sessions'
    );
    if (!user || !user.totpSecret) {
      return res.status(401).json({ error: 'Two-factor not configured' });
    }

    let verified = false;

    if (/^\d{6}$/.test(code)) {
      verified = await verifyTotp(user.totpSecret, code);
    }

    if (!verified && code.length >= 8) {
      for (let i = 0; i < user.totpBackupCodesHash.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await bcrypt.compare(code, user.totpBackupCodesHash[i]);
        if (ok) {
          user.totpBackupCodesHash.splice(i, 1);
          verified = true;
          break;
        }
      }
    }

    if (!verified) {
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    const accessToken = await issueSessionAndReturnAccess(user, req, res);
    res.json({ data: { user: user.toPublic(), accessToken } });
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const token = (req.query.token || '').toString();
    const id = (req.query.id || '').toString();
    if (!token || !id) {
      return res.status(400).json({ error: 'Missing verification parameters' });
    }

    const user = await User.findById(id).select(
      '+emailVerifyTokenHash +sessions'
    );
    if (!user) {
      return res.status(400).json({ error: 'Invalid verification link' });
    }
    if (user.isEmailVerified) {
      return res.status(200).json({
        data: { user: user.toPublic(), alreadyVerified: true },
      });
    }
    if (!user.emailVerifyTokenHash || !user.emailVerifyTokenExpires) {
      return res.status(400).json({ error: 'No verification pending for this account' });
    }
    if (user.emailVerifyTokenExpires < new Date()) {
      return res.status(400).json({
        error: 'Verification link has expired. Please request a new one.',
        code: 'VERIFY_EXPIRED',
      });
    }

    const matches = await bcrypt.compare(token, user.emailVerifyTokenHash);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid verification link' });
    }

    user.isEmailVerified = true;
    user.emailVerifyTokenHash = null;
    user.emailVerifyTokenExpires = null;
    await user.save();

    const accessToken = await issueSessionAndReturnAccess(user, req, res);
    res.json({ data: { user: user.toPublic(), verified: true, accessToken } });
  } catch (err) {
    next(err);
  }
}

async function resendVerification(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    if (!email || !isEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email' });
    }

    const user = await User.findOne({ email }).select('+emailVerifyTokenHash');
    if (!user || user.isEmailVerified) {
      return res.json({ data: { ok: true } });
    }

    try {
      await generateAndSendVerification(user);
    } catch (err) {
      console.error('resend sendVerificationEmail failed:', err.message);
      return res.status(502).json({ error: 'Could not send verification email right now. Please try again later.' });
    }

    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (!payload.sid) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const user = await User.findById(payload.sub).select('+sessions');
    if (!user) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const session = user.sessions.id(payload.sid);
    if (!session) {
      res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: 0 });
      return res.status(401).json({ error: 'Session expired' });
    }

    const matches = await compareTokenHash(token, session.refreshTokenHash);
    if (!matches) {
      session.deleteOne();
      await user.save();
      res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: 0 });
      return res.status(401).json({ error: 'Session expired' });
    }

    const newRefreshToken = signRefreshToken(user, session._id);
    session.refreshTokenHash = await hashToken(newRefreshToken);
    session.lastUsedAt = new Date();
    await user.save();

    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);
    const accessToken = signAccessToken(user, session._id);
    res.json({ data: { user: user.toPublic(), accessToken } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        if (payload.sid) {
          const user = await User.findById(payload.sub).select('+sessions');
          if (user) {
            const session = user.sessions.id(payload.sid);
            if (session) {
              session.deleteOne();
              await user.save();
            }
          }
        }
      } catch {
        // ignore — clear cookie regardless
      }
    }
    res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: 0 });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ data: { user: user.toPublic() } });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const name = (req.body?.name || '').trim();
    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.name = name;
    await user.save();
    res.json({ data: { user: user.toPublic() } });
  } catch (err) {
    next(err);
  }
}

async function deleteMe(req, res, next) {
  try {
    const password = req.body?.password || '';
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length > 256) {
      return res.status(400).json({ error: 'Password must be 256 characters or fewer' });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'admin') {
      return res
        .status(403)
        .json({ error: 'Administrator accounts cannot be deleted from the profile page' });
    }

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'Password is incorrect' });

    const bookingResult = await Booking.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });

    res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: 0 });
    res.json({ data: { ok: true, deletedBookings: bookingResult.deletedCount || 0 } });
  } catch (err) {
    next(err);
  }
}

async function requestPasswordChange(req, res, next) {
  try {
    const currentPassword = req.body?.currentPassword || '';
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }
    if (currentPassword.length > 256) {
      return res.status(400).json({ error: 'Password must be 256 characters or fewer' });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await user.verifyPassword(currentPassword);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.passwordChangeOtpHash = await bcrypt.hash(otp, 12);
    user.passwordChangeOtpExpires = new Date(Date.now() + PASSWORD_OTP_TTL_MS);
    await user.save();

    try {
      await sendPasswordChangeOtp({
        to: user.email,
        name: user.name,
        otp,
        ttlMinutes: PASSWORD_OTP_TTL_MIN,
      });
    } catch (mailErr) {
      user.passwordChangeOtpHash = null;
      user.passwordChangeOtpExpires = null;
      await user.save();
      console.error('sendPasswordChangeOtp failed:', mailErr.message);
      return res.status(502).json({ error: 'Could not send verification email. Please try again.' });
    }

    res.json({
      data: {
        ok: true,
        ttlMinutes: PASSWORD_OTP_TTL_MIN,
        emailHint: maskEmail(user.email),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function confirmPasswordChange(req, res, next) {
  try {
    const otp = String(req.body?.otp || '').trim();
    const newPassword = req.body?.newPassword || '';

    if (!otp || !newPassword) {
      return res.status(400).json({ error: 'OTP and new password are required' });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Enter the 6-digit code from your email' });
    }
    if (newPassword.length > 256) {
      return res.status(400).json({ error: 'Password must be 256 characters or fewer' });
    }
    const issues = passwordIssues(newPassword);
    if (issues.length > 0) {
      return res.status(400).json({ error: `New password must ${issues.join(', ')}` });
    }

    const user = await User.findById(req.user.id).select(
      '+passwordHash +passwordChangeOtpHash +passwordChangeOtpExpires'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.passwordChangeOtpHash || !user.passwordChangeOtpExpires) {
      return res.status(400).json({ error: 'Request a verification code first' });
    }
    if (user.passwordChangeOtpExpires < new Date()) {
      user.passwordChangeOtpHash = null;
      user.passwordChangeOtpExpires = null;
      await user.save();
      return res.status(400).json({
        error: 'Code expired. Request a new one and try again.',
        code: 'OTP_EXPIRED',
      });
    }

    const matches = await bcrypt.compare(otp, user.passwordChangeOtpHash);
    user.passwordChangeOtpHash = null;
    user.passwordChangeOtpExpires = null;

    if (!matches) {
      await user.save();
      return res.status(400).json({ error: 'Invalid code. Request a new one and try again.' });
    }

    if (await user.verifyPassword(newPassword)) {
      await user.save();
      return res.status(400).json({ error: 'New password must differ from the current password' });
    }

    await user.setPassword(newPassword);
    await user.save();
    res.json({ data: { ok: true, user: user.toPublic() } });
  } catch (err) {
    next(err);
  }
}

// ---- Forgot password (unauthenticated reset via emailed link) ----

async function forgotPassword(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    if (!email || !isEmail(email) || email.length > 200) {
      return res.status(400).json({ error: 'Enter a valid email' });
    }

    // Always respond 200 to avoid leaking which emails are registered.
    // Only verified accounts actually receive a reset email — unverified
    // users must finish email verification first.
    const user = await User.findOne({ email, isEmailVerified: true }).select(
      '+passwordResetTokenHash +passwordResetTokenExpires'
    );
    if (!user) {
      return res.json({ data: { ok: true } });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = await bcrypt.hash(rawToken, 12);
    user.passwordResetTokenExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await user.save();

    const base = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${base}/reset-password?token=${rawToken}&id=${user._id.toString()}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        ttlMinutes: PASSWORD_RESET_TTL_MIN,
      });
    } catch (mailErr) {
      user.passwordResetTokenHash = null;
      user.passwordResetTokenExpires = null;
      await user.save();
      console.error('sendPasswordResetEmail failed:', mailErr.message);
      return res
        .status(502)
        .json({ error: 'Could not send reset email. Please try again.' });
    }

    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const token = String(req.body?.token || '').trim();
    const id = String(req.body?.id || '').trim();
    const newPassword = req.body?.newPassword || '';

    if (!token || !id || !newPassword) {
      return res
        .status(400)
        .json({ error: 'token, id, and newPassword are required' });
    }
    if (newPassword.length > 256) {
      return res.status(400).json({ error: 'Password must be 256 characters or fewer' });
    }
    const issues = passwordIssues(newPassword);
    if (issues.length > 0) {
      return res.status(400).json({ error: `Password must ${issues.join(', ')}` });
    }

    let user;
    try {
      user = await User.findById(id).select(
        '+passwordHash +passwordResetTokenHash +passwordResetTokenExpires +sessions'
      );
    } catch {
      return res.status(400).json({ error: 'Invalid reset link' });
    }
    if (!user) {
      return res.status(400).json({ error: 'Invalid reset link' });
    }

    if (!user.passwordResetTokenHash || !user.passwordResetTokenExpires) {
      return res.status(400).json({ error: 'No reset pending for this account' });
    }
    if (user.passwordResetTokenExpires < new Date()) {
      user.passwordResetTokenHash = null;
      user.passwordResetTokenExpires = null;
      await user.save();
      return res.status(400).json({
        error: 'Reset link has expired. Request a new one.',
        code: 'RESET_EXPIRED',
      });
    }

    const matches = await bcrypt.compare(token, user.passwordResetTokenHash);
    // Single-shot: wipe the token after every attempt, success or failure.
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpires = null;
    if (!matches) {
      await user.save();
      return res.status(400).json({ error: 'Invalid or already-used reset link' });
    }

    if (await user.verifyPassword(newPassword)) {
      await user.save();
      return res
        .status(400)
        .json({ error: 'New password must differ from the current password' });
    }

    await user.setPassword(newPassword);
    // Resetting the password is a security event — kill every existing session
    // so a compromised device can't keep using its refresh token.
    user.sessions = [];
    await user.save();

    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

// ---- 2FA enrollment ----

function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i += 1) {
    codes.push(crypto.randomBytes(5).toString('hex'));
  }
  return codes;
}

async function setupTwoFactor(req, res, next) {
  try {
    const password = req.body?.password || '';
    if (!password) {
      return res.status(400).json({ error: 'Current password is required' });
    }

    const user = await User.findById(req.user.id).select('+passwordHash +totpSecret');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    if (user.totpSecret) {
      return res.status(409).json({ error: 'Two-factor authentication is already enabled' });
    }

    const secret = generateSecret();
    const backupCodes = generateBackupCodes(8);
    const backupHashes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 12))
    );

    user.totpEnrollmentSecret = secret;
    user.totpEnrollmentBackupHashes = backupHashes;
    user.totpEnrollmentExpires = new Date(Date.now() + TOTP_ENROLLMENT_TTL_MS);
    await user.save();

    const otpauthUrl = generateURI({
      issuer: 'Pokhara Tours and Travel',
      label: user.email,
      secret,
    });

    res.json({
      data: {
        otpauthUrl,
        secretBase32: secret,
        backupCodes,
        ttlMinutes: TOTP_ENROLLMENT_TTL_MS / 60000,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function enableTwoFactor(req, res, next) {
  try {
    const code = String(req.body?.code || '').trim();
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Enter the 6-digit code from your authenticator app' });
    }

    const user = await User.findById(req.user.id).select(
      '+totpSecret +totpEnrollmentSecret +totpEnrollmentBackupHashes +totpEnrollmentExpires'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.totpSecret) {
      return res.status(409).json({ error: 'Two-factor authentication is already enabled' });
    }
    if (
      !user.totpEnrollmentSecret ||
      !user.totpEnrollmentExpires ||
      user.totpEnrollmentExpires < new Date()
    ) {
      return res.status(400).json({
        error: 'Enrollment expired. Start the setup again.',
        code: 'TOTP_ENROLLMENT_EXPIRED',
      });
    }

    const ok = await verifyTotp(user.totpEnrollmentSecret, code);
    if (!ok) {
      return res.status(400).json({ error: 'Invalid code. Try again.' });
    }

    user.totpSecret = user.totpEnrollmentSecret;
    user.totpBackupCodesHash = user.totpEnrollmentBackupHashes;
    user.totpEnrolledAt = new Date();
    user.totpEnrollmentSecret = null;
    user.totpEnrollmentBackupHashes = [];
    user.totpEnrollmentExpires = null;
    await user.save();

    sendTwoFactorEnabledNotice({
      to: user.email,
      name: user.name,
      when: new Date(),
    }).catch((mailErr) => {
      console.error('sendTwoFactorEnabledNotice failed:', mailErr.message);
    });

    res.json({ data: { ok: true, user: user.toPublic() } });
  } catch (err) {
    next(err);
  }
}

async function disableTwoFactor(req, res, next) {
  try {
    const password = req.body?.password || '';
    const code = String(req.body?.code || '').trim();
    if (!password || !code) {
      return res.status(400).json({ error: 'Password and current 2FA code are required' });
    }

    const user = await User.findById(req.user.id).select(
      '+passwordHash +totpSecret +totpBackupCodesHash'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.totpSecret) {
      return res.status(409).json({ error: 'Two-factor authentication is not enabled' });
    }

    const passOk = await user.verifyPassword(password);
    if (!passOk) return res.status(401).json({ error: 'Password is incorrect' });

    let codeOk = false;
    if (/^\d{6}$/.test(code)) {
      codeOk = await verifyTotp(user.totpSecret, code);
    }
    if (!codeOk) {
      for (let i = 0; i < user.totpBackupCodesHash.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const match = await bcrypt.compare(code, user.totpBackupCodesHash[i]);
        if (match) {
          codeOk = true;
          break;
        }
      }
    }
    if (!codeOk) {
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    user.totpSecret = null;
    user.totpBackupCodesHash = [];
    user.totpEnrolledAt = null;
    await user.save();

    sendTwoFactorDisabledNotice({
      to: user.email,
      name: user.name,
      when: new Date(),
    }).catch((mailErr) => {
      console.error('sendTwoFactorDisabledNotice failed:', mailErr.message);
    });

    res.json({ data: { ok: true, user: user.toPublic() } });
  } catch (err) {
    next(err);
  }
}

// ---- Sessions ----

async function listSessions(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('+sessions');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const items = user.sessions
      .map((s) => ({
        id: s._id.toString(),
        deviceLabel: s.deviceLabel || 'Unknown device',
        ipAddress: s.ipAddress || '',
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        current: s._id.toString() === (req.user.sid || ''),
      }))
      .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());

    res.json({ data: { items } });
  } catch (err) {
    next(err);
  }
}

async function revokeSession(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id).select('+sessions');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const session = user.sessions.id(id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isCurrent = id === (req.user.sid || '');
    session.deleteOne();
    await user.save();

    if (isCurrent) {
      res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: 0 });
    }
    res.json({ data: { ok: true, current: isCurrent } });
  } catch (err) {
    next(err);
  }
}

async function revokeOtherSessions(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('+sessions');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentSid = req.user.sid || '';
    user.sessions = user.sessions.filter((s) => s._id.toString() === currentSid);
    await user.save();

    res.json({ data: { ok: true, remaining: user.sessions.length } });
  } catch (err) {
    next(err);
  }
}

function maskEmail(email) {
  const [local, domain] = String(email || '').split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

module.exports = {
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
};
