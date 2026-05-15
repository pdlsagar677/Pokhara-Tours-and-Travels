const axios = require('axios');

// -----------------------------------------------------------------------------
// SMTP / nodemailer transport — DISABLED.
// Render's free tier blocks outbound SMTP ports (25/465/587), so we send via
// Brevo's HTTPS API (port 443) instead. The code below is kept for reference
// in case we move back to direct SMTP on a different host.
// -----------------------------------------------------------------------------
// const nodemailer = require('nodemailer');
//
// let cachedTransport = null;
//
// function getTransport() {
//   if (cachedTransport) return cachedTransport;
//   const port = Number(process.env.SMTP_PORT) || 465;
//   const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
//   cachedTransport = nodemailer.createTransport({
//     host: process.env.SMTP_HOST || 'smtp.gmail.com',
//     port,
//     secure,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });
//   return cachedTransport;
// }
//
// function fromAddress() {
//   const name = String(process.env.SMTP_FROM_NAME || 'Pokhara Tours and Travel')
//     .replace(/[\r\n"]+/g, ' ')
//     .slice(0, 120);
//   const user = String(process.env.SMTP_USER || '').replace(/[\r\n<>]+/g, '');
//   return `"${name}" <${user}>`;
// }
// -----------------------------------------------------------------------------

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

async function sendViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set — cannot send email');
  }
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL is not set — cannot send email');
  }
  const fromName = String(process.env.RESEND_FROM_NAME || 'Pokhara Tours and Travel')
    .replace(/[\r\n"]+/g, ' ')
    .slice(0, 120);

  try {
    await axios.post(
      RESEND_ENDPOINT,
      {
        from: `${fromName} <${fromEmail}>`,
        to: [sanitizeHeader(to)],
        subject: sanitizeHeader(subject),
        html,
        text,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      }
    );
  } catch (err) {
    // Surface Resend's actual error body (e.g. "domain not verified") instead
    // of axios's generic 4xx message.
    if (err.response) {
      const { status, data } = err.response;
      const detail = typeof data === 'string' ? data : JSON.stringify(data);
      throw new Error(`Resend send failed (${status}): ${detail}`);
    }
    throw err;
  }
}

async function sendVerificationEmail({ to, name, otp, ttlMinutes }) {
  const safeName = escapeHtml(name);
  const safeOtp = escapeHtml(otp);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#14141f">
      <div style="padding:24px 0;text-align:center">
        <h2 style="color:#0284c7;margin:0">Pokhara Tours and Travel</h2>
      </div>
      <div style="background:#f5f7fa;padding:28px;border-radius:12px">
        <h3 style="margin-top:0">Hi ${safeName},</h3>
        <p>Welcome aboard! Enter the code below on the verification page to activate your account. The code expires in ${ttlMinutes} minutes.</p>
        <p style="text-align:center;margin:28px 0">
          <span style="display:inline-block;background:#fff;border:2px dashed #0284c7;padding:18px 32px;border-radius:12px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#0284c7;font-family:monospace">${safeOtp}</span>
        </p>
        <p style="font-size:12px;color:#6b7280;margin-top:24px">If you didn&rsquo;t sign up, you can safely ignore this email.</p>
      </div>
      <div style="text-align:center;font-size:12px;color:#6b7280;padding:16px 0">
        © ${new Date().getFullYear()} Pokhara Tours and Travel
      </div>
    </div>
  `;

  await sendViaResend({
    to,
    subject: `Your verification code: ${otp}`,
    html,
    text: `Hi ${name},\n\nYour email verification code is: ${otp}\n\nThis code expires in ${ttlMinutes} minutes. If you didn't sign up, ignore this email.`,
  });
}

async function sendContactReply({ to, name, originalSubject, originalMessage, replyBody }) {
  const safeName = escapeHtml(name);
  const safeSubject = escapeHtml(originalSubject);
  const safeOriginal = escapeHtml(originalMessage).replace(/\n/g, '<br>');
  const safeReply = escapeHtml(replyBody).replace(/\n/g, '<br>');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#14141f">
      <div style="padding:24px 0;text-align:center">
        <h2 style="color:#0284c7;margin:0">Pokhara Tours and Travel</h2>
      </div>
      <div style="background:#f5f7fa;padding:28px;border-radius:12px">
        <h3 style="margin-top:0">Hi ${safeName},</h3>
        <p>Thanks for reaching out. Here&rsquo;s our reply to your message about <strong>${safeSubject}</strong>:</p>
        <div style="background:#fff;border-left:4px solid #0284c7;padding:14px 18px;border-radius:8px;margin:18px 0;line-height:1.6">
          ${safeReply}
        </div>
        <p style="font-size:13px;color:#6b7280">If you have more questions, just reply to this email — it lands straight in our inbox.</p>
        <details style="margin-top:24px;font-size:12px;color:#6b7280">
          <summary style="cursor:pointer">Your original message</summary>
          <div style="background:#fff;padding:12px;border-radius:8px;margin-top:8px;line-height:1.5">
            <strong>${safeSubject}</strong><br>${safeOriginal}
          </div>
        </details>
      </div>
      <div style="text-align:center;font-size:12px;color:#6b7280;padding:16px 0">
        © ${new Date().getFullYear()} Pokhara Tours and Travel
      </div>
    </div>
  `;

  await sendViaResend({
    to,
    subject: `Re: ${originalSubject}`,
    html,
    text: `Hi ${name},\n\n${replyBody}\n\n— Pokhara Tours and Travel`,
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// SMTP headers are CRLF-delimited. A user-supplied value carrying \r or \n
// can splice in additional headers (Bcc:, From:, etc.) on transports that
// don't fold or reject them. Apply to anything that lands in `subject`,
// `to`, `from`, `cc`, `bcc`.
function sanitizeHeader(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').slice(0, 200);
}

async function sendPasswordChangeOtp({ to, name, otp, ttlMinutes }) {
  const safeName = escapeHtml(name);
  const safeOtp = escapeHtml(otp);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#14141f">
      <div style="padding:24px 0;text-align:center">
        <h2 style="color:#0284c7;margin:0">Pokhara Tours and Travel</h2>
      </div>
      <div style="background:#f5f7fa;padding:28px;border-radius:12px">
        <h3 style="margin-top:0">Hi ${safeName},</h3>
        <p>Use the code below to confirm your password change. The code expires in ${ttlMinutes} minutes.</p>
        <p style="text-align:center;margin:28px 0">
          <span style="display:inline-block;background:#fff;border:2px dashed #0284c7;padding:18px 32px;border-radius:12px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#0284c7;font-family:monospace">${safeOtp}</span>
        </p>
        <p style="font-size:13px;color:#6b7280">If you didn&rsquo;t request this change, you can safely ignore this email — your password stays the same.</p>
      </div>
      <div style="text-align:center;font-size:12px;color:#6b7280;padding:16px 0">
        © ${new Date().getFullYear()} Pokhara Tours and Travel
      </div>
    </div>
  `;

  await sendViaResend({
    to,
    subject: `Your password change code: ${otp}`,
    html,
    text: `Hi ${name},\n\nYour password change code is: ${otp}\n\nThis code expires in ${ttlMinutes} minutes. If you didn't request this, ignore this email.`,
  });
}

async function sendPasswordResetEmail({ to, name, resetUrl, ttlMinutes }) {
  const safeName = escapeHtml(name);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#14141f">
      <div style="padding:24px 0;text-align:center">
        <h2 style="color:#0284c7;margin:0">Pokhara Tours and Travel</h2>
      </div>
      <div style="background:#f5f7fa;padding:28px;border-radius:12px">
        <h3 style="margin-top:0">Hi ${safeName},</h3>
        <p>We received a request to reset your password. Click the button below to choose a new one — the link expires in ${ttlMinutes} minutes.</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${resetUrl}" style="background:#0284c7;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;display:inline-block">Reset my password</a>
        </p>
        <p style="font-size:13px;color:#6b7280">Or copy this link into your browser:<br>
          <a href="${resetUrl}" style="color:#0284c7;word-break:break-all">${resetUrl}</a>
        </p>
        <p style="font-size:12px;color:#6b7280;margin-top:24px">If you didn&rsquo;t request this, you can safely ignore this email — your password stays the same.</p>
      </div>
      <div style="text-align:center;font-size:12px;color:#6b7280;padding:16px 0">
        © ${new Date().getFullYear()} Pokhara Tours and Travel
      </div>
    </div>
  `;

  await sendViaResend({
    to,
    subject: 'Reset your password — Pokhara Tours and Travel',
    html,
    text: `Hi ${name},\n\nReset your password by visiting:\n${resetUrl}\n\nThis link expires in ${ttlMinutes} minutes. If you didn't request this, ignore this email.`,
  });
}

async function sendTwoFactorNotice({ to, name, when, enabled }) {
  const safeName = escapeHtml(name);
  const action = enabled ? 'enabled' : 'disabled';
  const headline = enabled
    ? 'Two-factor authentication is now active on your account.'
    : 'Two-factor authentication has been turned off on your account.';
  const safeWhen = escapeHtml(new Date(when).toUTCString());

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#14141f">
      <div style="padding:24px 0;text-align:center">
        <h2 style="color:#0284c7;margin:0">Pokhara Tours and Travel</h2>
      </div>
      <div style="background:#f5f7fa;padding:28px;border-radius:12px">
        <h3 style="margin-top:0">Hi ${safeName},</h3>
        <p>${headline}</p>
        <p style="font-size:13px;color:#6b7280">Time: ${safeWhen}</p>
        <p style="font-size:13px;color:#6b7280">If this wasn&rsquo;t you, change your password immediately and contact support.</p>
      </div>
      <div style="text-align:center;font-size:12px;color:#6b7280;padding:16px 0">
        © ${new Date().getFullYear()} Pokhara Tours and Travel
      </div>
    </div>
  `;

  await sendViaResend({
    to,
    subject: `Two-factor authentication ${action}`,
    html,
    text: `Hi ${name},\n\n${headline}\n\nTime: ${new Date(when).toUTCString()}\n\nIf this wasn't you, change your password immediately.`,
  });
}

async function sendTwoFactorEnabledNotice({ to, name, when }) {
  return sendTwoFactorNotice({ to, name, when, enabled: true });
}

async function sendTwoFactorDisabledNotice({ to, name, when }) {
  return sendTwoFactorNotice({ to, name, when, enabled: false });
}

module.exports = {
  sendVerificationEmail,
  sendContactReply,
  sendPasswordChangeOtp,
  sendPasswordResetEmail,
  sendTwoFactorEnabledNotice,
  sendTwoFactorDisabledNotice,
};
