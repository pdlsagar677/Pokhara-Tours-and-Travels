const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const PHONE_RE = /^\+?[0-9][0-9\-\s()]{5,19}$/;

function isEmail(v) {
  return typeof v === 'string' && EMAIL_RE.test(v.trim());
}

function isUsername(v) {
  return typeof v === 'string' && USERNAME_RE.test(v.trim().toLowerCase());
}

function isPhone(v) {
  return typeof v === 'string' && PHONE_RE.test(v.trim());
}

function passwordIssues(v) {
  const issues = [];
  if (typeof v !== 'string' || v.length < 8) issues.push('be at least 8 characters');
  if (!/[A-Z]/.test(v || '')) issues.push('include an uppercase letter');
  if (!/[a-z]/.test(v || '')) issues.push('include a lowercase letter');
  if (!/[0-9]/.test(v || '')) issues.push('include a number');
  if (!/[^A-Za-z0-9]/.test(v || '')) issues.push('include a special character');
  return issues;
}

function escapeRegex(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Validate an admin-supplied package gallery URL. Decision (May 2026):
// - HTTPS only (no mixed-content, no http://). Implicitly rejects `data:`,
//   `javascript:`, `file:`, etc. since those don't parse to `https:`.
// - No userinfo in the URL (foo:bar@host) — Next/Image would fetch with creds.
// - No raw IP-literal hosts — they bypass DNS-based reputation and admin trust.
// - Length cap 500 chars.
// Intentionally NOT a host whitelist so admins can paste any HTTPS CDN.
// Returns { ok: true } or { ok: false, error }.
function validateGalleryUrl(raw) {
  const s = String(raw || '').trim();
  if (s.length === 0) return { ok: false, error: 'URL is required' };
  if (s.length > 500) return { ok: false, error: 'URL is too long' };
  let u;
  try {
    u = new URL(s);
  } catch {
    return { ok: false, error: 'Not a valid URL' };
  }
  if (u.protocol !== 'https:') {
    return { ok: false, error: 'Must be an https:// URL' };
  }
  if (u.username || u.password) {
    return { ok: false, error: 'URLs with embedded credentials are not allowed' };
  }
  const host = u.hostname;
  if (!host) return { ok: false, error: 'Missing host' };
  // Reject IPv4-literal and IPv6-literal hosts.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return { ok: false, error: 'IP-literal hosts are not allowed' };
  }
  if (host.includes(':') || host.startsWith('[')) {
    return { ok: false, error: 'IP-literal hosts are not allowed' };
  }
  return { ok: true };
}

module.exports = {
  isEmail,
  isUsername,
  isPhone,
  passwordIssues,
  escapeRegex,
  validateGalleryUrl,
};
