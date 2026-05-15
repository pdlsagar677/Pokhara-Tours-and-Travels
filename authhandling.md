# Auth Handling — Session-Bound JWT with Multi-Device Support

> A reusable pattern for stateful, revocable access tokens with per-device session tracking. Written so you can copy the approach into other applications (any stack, any database). Backed by a production implementation in this repo — file paths are listed at the end for reference.

---

## 1. What this is, what it isn't

**Name:** *session-bound JWT* (also: *revocable JWT*, *stateful JWT*, "JWT-as-session-pointer"). You sign a JSON Web Token that carries a `sid` claim — the id of a server-side session row. Every protected request verifies the signature **and** looks the session up. Logout, password reset, or "sign out everywhere" delete the session row, and the still-unexpired access token is rejected on its very next use.

**It is NOT:**

- **RFC 8473 Token Binding** — cryptographic binding of an HTTP token to the underlying TLS channel. Browser support was withdrawn; not deployable in 2026.
- **DPoP (RFC 9449)** — the client holds a private key and signs each request to prove possession. Higher security, real client-side complexity, mostly used for OAuth/OIDC.
- **A pure stateless JWT** — those can't be revoked before natural expiry. That's exactly the problem this pattern fixes.
- **Device fingerprinting** — comparing user-agent/IP/canvas signals across requests. This pattern *stores* device info but does not *enforce* a per-request match. That's a natural upgrade, covered in §11.

---

## 2. When to use this pattern

**Good fit:**

- SPAs with an httpOnly refresh cookie + in-memory access token (the most common modern web pattern).
- Mobile apps that need real revocation (e.g., remote logout from a web admin panel).
- Multi-device per user (laptop + phone + tablet) with per-device "active sessions" UI.
- Apps that have password reset, "sign out everywhere", or 2FA enable/disable as security events — all of which expect existing tokens to die immediately.

**Overkill or wrong fit:**

- Machine-to-machine APIs (use opaque tokens or client-credentials OAuth).
- Very high assurance (financial trading, healthcare clinical) — go to DPoP or mTLS.
- Stateless edge functions where you can't afford the DB lookup per request and revocation isn't a requirement.

---

## 3. Threat model addressed

You're trading a tiny bit of stateless-JWT performance for these concrete protections:

| Threat                                                                 | What this pattern does                                          |
|------------------------------------------------------------------------|-----------------------------------------------------------------|
| User logs out, but their access token was already stolen               | Session row deleted → next use of stolen token returns 401.     |
| Password is reset (after suspected compromise)                          | All session rows wiped → every existing token dies.             |
| User wants to "sign out everywhere else" from one device                | Keep current session row, delete all others → other devices die. |
| Admin needs to revoke a specific lost/stolen device                    | Targeted delete by `sid` → that one device dies, others fine.   |
| Refresh-token replay (attacker captured a cookie)                      | Each refresh rotates the hash; reused old hash → session wiped. |

What this pattern does **not** address: an access token replayed from a different device *within its short lifetime*. That's the role of §11's optional device-binding upgrade.

---

## 4. The data model

You need a `sessions` collection/array — one row per logged-in device. Two storage shapes, pick one:

### Shape A — embedded sub-array on the user (used in this repo)

```js
// Mongoose example
const sessionSchema = new mongoose.Schema(
  {
    refreshTokenHash: { type: String, required: true },
    userAgent:        { type: String, default: '' },
    ipAddress:        { type: String, default: '' },
    deviceLabel:      { type: String, default: '' }, // e.g. "Chrome on macOS"
    createdAt:        { type: Date,   default: Date.now },
    lastUsedAt:       { type: Date,   default: Date.now },
  },
  { _id: true } // _id is the session id you'll put in the JWT
);

const userSchema = new mongoose.Schema({
  // ...your normal user fields...
  sessions: { type: [sessionSchema], default: [], select: false },
});
```

- **Pros:** one document per user, atomic per-user writes, no joins.
- **Cons:** MongoDB documents are capped at 16 MB (effectively a non-issue with a per-user cap of 10 sessions), and "list all active sessions across all users" requires aggregation.

### Shape B — separate `sessions` table/collection (SQL-friendly)

```sql
CREATE TABLE sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash  TEXT NOT NULL,
  user_agent          TEXT,
  ip_address          INET,
  device_label        TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  last_used_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON sessions (user_id, last_used_at DESC);
```

- **Pros:** trivial global queries, no per-document size cap.
- **Cons:** one extra join (or one extra lookup) per protected request — easy enough on indexed columns.

Whatever you pick, the **minimum required fields** are the same: `id` (the `sid`), `refresh_token_hash`, and `last_used_at`. Everything else (`user_agent`, `ip_address`, `device_label`, `created_at`) exists so the user can audit their own active sessions and so you can show a useful "where you're signed in" list.

---

## 5. Tokens — JWT shape, lifetimes, transport

Two tokens, both signed with HS256 (or RS256 if you prefer asymmetric).

### Access token

- **TTL:** 15 minutes.
- **Payload:** `{ sub: userId, role?, sid: sessionId }`.
- **Returned in:** the login response JSON only.
- **Stored on the client:** in memory (e.g. a Zustand/Pinia/Redux store, **never** in localStorage or a non-httpOnly cookie). Lost on tab close. Refresh recovers it.
- **Sent on:** every API call, as `Authorization: Bearer <token>`.

### Refresh token

- **TTL:** 7 days.
- **Payload:** `{ sub: userId, sid: sessionId }`.
- **Transport:** **httpOnly + Secure + SameSite=Lax** cookie, path-scoped to your refresh endpoint (e.g. `/api/auth`).
- **Stored on the server:** only as `bcrypt(refreshToken, 12)` on the session row. Never the plaintext.

### The non-negotiable rule

**Both tokens carry the same `sid`.** That is the only link between the JWT and the server-side session row. Without `sid`, the access token is just a signed claim that the user existed at login time — you can't revoke it.

### Why two tokens

Short access tokens cap the blast radius if one is stolen (≤15 min of damage). A long refresh token gives the user a smooth UX (don't log them out every 15 min) and lives somewhere the JavaScript can't read (httpOnly cookie). The session-bound design makes the long token *revocable on demand*.

---

## 6. Login / session issuance flow

When credentials check out, do exactly this — in this order:

1. **Verify credentials** with bcrypt (constant-time; always run a dummy bcrypt compare for unknown emails so timing doesn't leak which addresses exist).
2. **Create a new session row.** Capture `userAgent`, `ipAddress`, parse a friendly `deviceLabel` (e.g., via `ua-parser-js`). Mongoose: `user.sessions.create({...})` and `push`. SQL: `INSERT ... RETURNING id`. The returned id is your `sid`.
3. **Sign the refresh JWT** with `{ sub, sid }`. Compute `bcrypt(refreshToken, 12)` and store it on the new row (`refreshTokenHash`).
4. **Sign the access JWT** with `{ sub, role, sid }`.
5. **FIFO-prune** to `MAX_SESSIONS_PER_USER` (10 is a good default). Sort sessions ascending by `lastUsedAt` and drop from the front until the cap is met.
6. **Set the refresh cookie** (`httpOnly`, `Secure` in prod, `SameSite=Lax`, `Path=/api/auth`, `Max-Age=7d`). **Return the access token in the response JSON.**

Anti-patterns to avoid here:

- Re-using one "current" session row across re-logins on the same browser. Always create a new row; the prune step keeps the count bounded.
- Storing the refresh token plaintext. Bcrypt-hash it. The user's cookie is the only place the plaintext lives.
- Returning the refresh token in the response body. The cookie *is* the transport — body-returning re-exposes it to JavaScript.

---

## 7. Per-request validation (the load-bearing part)

This is the change that turns a stateless JWT into a revocable one. Every protected route hits this middleware:

1. Read `Authorization: Bearer <token>`. Missing → `401`.
2. Verify the JWT signature and expiry. Invalid → `401`.
3. **Stateful check:** look up the session row by `(sub, sid)`. Row missing → `401` with a distinct error code such as `SESSION_REVOKED` so the SPA can tell the user "you were signed out elsewhere".
4. Bump `session.lastUsedAt = new Date()`. Best-effort save — never let this error break the request.
5. Attach `req.user = { id: sub, role, sid }` and call `next()`.

### Why not skip step 3?

Without step 3, your access token survives logout, password reset, session revocation, and 2FA disable for its entire 15-minute lifetime. Every other revocation mechanism in the app is half-broken. Step 3 is the load-bearing fix — every other layer assumes it exists.

### The optional middleware variant

Public endpoints that personalize when logged in (think "recommended for you" or anonymous-or-authed reads) should use an **optional** version of the same middleware. Differences:

- Missing or invalid token → continue as anonymous, do **not** 401.
- Valid JWT but **missing session row** → also continue as anonymous (treat as logged out). This is critical — without it, a session-revoked user keeps getting personalized data for 15 min.

---

## 8. Refresh / rotation flow

When the SPA sees a `401` on a protected call, it hits `POST /api/auth/refresh` and retries the original request. Server side:

1. Read the `refreshToken` cookie. Missing → `401`.
2. Verify the JWT signature and expiry. Invalid → `401`.
3. Find the session row by `(sub, sid)` from the payload. Missing → `401`.
4. `bcrypt.compare(cookieToken, session.refreshTokenHash)`.
   - **Match:** legitimate refresh. Sign a new refresh JWT (same `sid`), recompute and store its bcrypt hash on the row, sign a new access JWT, set the new cookie, return `{ user, accessToken }`.
   - **Mismatch:** suspected reuse (someone is replaying an old cookie). **Wipe just that session row** (not all of them — only this one is compromised). Return `401`.
5. Bump `lastUsedAt`.

### The two-tab race

If the same browser has two tabs open and both fire `/refresh` at the same time, both will read the same `refreshTokenHash`, both will pass the bcrypt compare, both will write a new hash. First write wins; the second is the "real" new hash. The first tab's freshly-issued tokens are now stale and the next refresh from that tab will fail — and the SPA will redirect to login.

**Fix on the client, not the server:** make the SPA's refresh call single-flight. When a refresh is in flight, queue subsequent 401s and resolve them all from the one shared promise.

### Cookie path scoping

Path-scoping the refresh cookie to `/api/auth` (not `/`) means the browser only sends it to refresh/logout endpoints. Combined with `SameSite=Lax` and the bearer-only model for the access token, this gives you a quiet defense against CSRF without needing a CSRF token middleware.

---

## 9. Logout / revocation / multi-device controls

Three levels of "sign out", each one line of code:

### This-device logout

Pull only the row matching the request's `sid`:

```js
// Mongoose
user.sessions.pull(req.user.sid);
await user.save();
res.clearCookie('refreshToken', refreshCookieOptions);
```

```sql
-- Postgres
DELETE FROM sessions WHERE id = $1 AND user_id = $2;
```

The other devices are untouched.

### "Sign out everywhere else"

Keep current, pull the rest:

```js
user.sessions = user.sessions.filter((s) => s._id.toString() === req.user.sid);
await user.save();
```

```sql
DELETE FROM sessions WHERE user_id = $1 AND id <> $2;
```

### Security-event wipe (password reset, 2FA disable, etc.)

Empty everything:

```js
user.sessions = [];
await user.save();
```

```sql
DELETE FROM sessions WHERE user_id = $1;
```

Pair this with `res.clearCookie(...)` so the device that *initiated* the security event also gets a clean slate.

---

## 10. Multi-device behavior — the practical answer

This is where the model shines and where most ad-hoc auth implementations get it wrong.

### The mechanic in one paragraph

Each successful login or 2FA-confirm call creates a **new session row** with a fresh `sid`. The access JWT and refresh JWT it returns both carry that `sid`. The refresh cookie lives in *that* browser's cookie jar. Different browsers, different devices, incognito windows — they all have separate cookie jars and therefore separate refresh tokens. So each device is associated with exactly one independent session row. They coexist freely.

### How many devices can be logged in at once

`MAX_SESSIONS_PER_USER` — 10 is a reasonable default. On the 11th login, the FIFO prune (sort by `lastUsedAt` ascending, drop the oldest) removes the least-recently-used row. The device using that row will get `401 SESSION_REVOKED` on its next protected request — and the SPA can show "you've been signed out — too many devices".

Below the cap, **all devices work concurrently**:

- Each has its own access token (different `sid`).
- Each has its own refresh token (different cookie jar, different bcrypt hash).
- Refresh rotation on one device doesn't touch any other device's hash.
- Per-request `lastUsedAt` bumps are per-session, so the prune order reflects real recency.

### What kicks Device B when Device A does X

| Action on Device A                          | Device B effect           | Reason                                          |
|---------------------------------------------|---------------------------|-------------------------------------------------|
| Logout                                      | None                      | Only A's session row is pulled.                 |
| Sign out everywhere else                    | **B logged out**          | Keep current `sid`, pull all others.            |
| Password reset                              | **B logged out**          | `sessions = []` — full wipe.                    |
| Disable 2FA / change password (OTP confirm) | **B logged out**          | Same full-wipe pattern.                         |
| Revoke specific session (B's)               | **B logged out**          | Targeted by `sid`.                              |
| Revoke specific session (C's)               | None                      | Targeted; doesn't touch A or B.                 |
| Hit the device cap (11th login)             | **Oldest device logged out** | FIFO prune by `lastUsedAt`.                  |

### Edge cases worth knowing

- **Same browser, two tabs:** *one* session, shared cookie. Each tab's requests bump the same `lastUsedAt`. See §8 for the refresh race.
- **Same browser, normal + incognito:** two sessions; incognito has its own cookie jar.
- **Phone + laptop:** two sessions, fully independent.
- **Mobile carrier IP swap:** no effect (we record IP but don't compare it).
- **Browser update changing the UA string:** no effect (same — recorded, not compared).
- **VPN toggled mid-session:** no effect.

---

## 11. What this pattern does NOT protect against, and the natural upgrades

### Replay of a fresh access token from a different device, within 15 minutes

This is the residual gap. An attacker who reads your in-memory access token (e.g., via XSS) can replay it from anywhere until it expires. The session-bound check passes because the session row is still active.

**Upgrade:** *device binding*. On each protected request, also verify a stable device signal against what was recorded at session creation. Choices, in order of friction:

- **UA hash only.** Hash `userAgent` at issuance, compare on each request. Cheap, catches most token-stolen-from-browser-replayed-from-curl cases. Some false positives when the browser auto-updates and the UA string changes mid-session.
- **UA + IP-subnet.** Add a coarse IP-subnet check (`/24` for IPv4, `/56` for IPv6). Catches cross-network replay. More friction for mobile users who roam.
- **Soft mode.** Log mismatches to a security event collection, surface in `/profile`, but don't auto-revoke. Useful as a telemetry rollout before flipping to hard mode.

### Fully compromised client (XSS reads the in-memory access token)

The pattern doesn't stop this — XSS gives the attacker direct API access using the user's token. Defenses live elsewhere: a real CSP, harden the cookies, keep access TTL short (which this pattern requires anyway), and ensure revocation is fast (which this pattern delivers).

### Lack of cryptographic device binding

For "the token must be useless even if exfiltrated":

- **DPoP (RFC 9449):** the client generates a key pair per session and signs a JWT per request proving possession. Server verifies the proof against the public key stored on the session row. Real complexity bump on the frontend (WebCrypto, key storage in IndexedDB), but you get strong proof-of-possession.
- **RFC 8473 Token Binding:** binds the token to the TLS channel itself. Best in theory; not available in 2026 because browser support was withdrawn.

Most apps stop at session-bound JWT. Apps with regulatory pressure go to DPoP.

---

## 12. Common pitfalls

1. **Forgetting the stateful check on the *optional* middleware.** Optional auth that only verifies the JWT signature lets a revoked user keep getting personalized data for 15 min. Fix: same `(sub, sid)` lookup; on miss, fall through to anonymous, don't 401.
2. **Same error code/text for "JWT invalid" and "session revoked".** The client can't surface a useful message. Use distinct codes (`INVALID_TOKEN`, `SESSION_REVOKED`).
3. **`MAX_SESSIONS_PER_USER` too low** → legitimate users get kicked off mid-trip. **Too high** → an attacker who steals a refresh token can spin up arbitrary "sessions" without naturally aging out. 10 is fine for consumer apps; pick to fit your audience.
4. **Not bumping `lastUsedAt` on every protected request.** The FIFO prune then evicts active devices because their recency is stale.
5. **Bcrypt cost set for password hashing only, then re-used for refresh-token hashing.** Measure login latency. Refresh tokens are long random strings — you can run a faster `bcrypt` cost (10) on them or use `argon2id` for password and SHA-256 HMAC for refresh, separately.
6. **Re-using one "current" session row across re-logins on the same device.** Don't. Each login creates a new row; the prune keeps the count bounded. Re-use breaks the "list my devices" UI because it merges history.
7. **Returning the same `lastUsedAt` you read pre-bump in the response.** Read-then-write-then-respond gives the client a stale value. Bump first, then read.
8. **Logging full URLs that contain the refresh token or single-use tokens.** Single-use email-verify or reset URLs land in access logs. Redact `token`, `code`, `secret`, `signature` from morgan/your log format.

---

## 13. Migration tips (adding this to an existing app with stateless JWTs)

You almost never get to design this from scratch. Existing app, pure JWTs, no sessions table. Migration in three phases:

1. **Phase 1 — additive.** Add the `sessions` table/array. Issue new access tokens with `sid` claim, store a session row at login. Keep `authRequired` accepting *both* tokens with and without `sid` (without → fall back to old behavior). Now every new login is session-bound; old tokens still work for one rotation cycle.
2. **Phase 2 — enforce.** After the longest access TTL has passed since deploy (so all "old" tokens have expired), make the middleware require `sid`. Stateless tokens without `sid` start being rejected. Bonus: profile this; if the extra DB hit shows up in p99, add a per-process LRU cache keyed by `(sub, sid)` with a 60-second TTL, busted on writes to `sessions`.
3. **Phase 3 — clean up.** Remove the fallback branch in middleware. Wire revoke/logout/etc. to the session table. Add the "Active sessions" UI.

If you don't have any refresh-token storage today, the simplest migration is: don't bother backfilling; force every user to re-login at deploy time. For most apps, 7 days of natural churn lets the old tokens age out without an outage.

---

## 14. Code skeletons

Canonical, copy-pasteable. Identifiers are generic — `User`, `sessionSchema`, `signAccessToken`, etc. Substitute for your stack.

### Schema (§4)

```js
// models/User.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    refreshTokenHash: { type: String, required: true },
    userAgent:        { type: String, default: '' },
    ipAddress:        { type: String, default: '' },
    deviceLabel:      { type: String, default: '' },
    createdAt:        { type: Date,   default: Date.now },
    lastUsedAt:       { type: Date,   default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema({
  email:        { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true, select: false },
  role:         { type: String, default: 'user' },
  sessions:     { type: [sessionSchema], default: [], select: false },
});

module.exports = mongoose.model('User', userSchema);
```

### Issue session at login (§6)

```js
// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { signAccessToken, signRefreshToken, refreshCookieOptions } = require('../utils/tokens');

const MAX_SESSIONS_PER_USER = 10;

async function issueSession(user, req, res) {
  const session = user.sessions.create({
    refreshTokenHash: 'placeholder',
    userAgent:        String(req.headers['user-agent'] || '').slice(0, 500),
    ipAddress:        (req.ip || '').slice(0, 64),
    deviceLabel:      parseDeviceLabel(req.headers['user-agent']),
    createdAt:        new Date(),
    lastUsedAt:       new Date(),
  });
  user.sessions.push(session);

  const refreshToken = signRefreshToken(user, session._id); // payload { sub, sid }
  session.refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  if (user.sessions.length > MAX_SESSIONS_PER_USER) {
    user.sessions.sort(
      (a, b) => new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime()
    );
    while (user.sessions.length > MAX_SESSIONS_PER_USER) user.sessions.shift();
  }

  await user.save();
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return signAccessToken(user, session._id); // payload { sub, role, sid }
}
```

### Per-request validation (§7)

```js
// middleware/auth.js
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/tokens');

async function authRequired(req, _res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(httpError(401, 'Authentication required'));

  let payload;
  try { payload = verifyAccessToken(token); }
  catch { return next(httpError(401, 'Invalid or expired token')); }

  if (payload.sid) {
    const user = await User.findById(payload.sub).select('+sessions');
    const session = user && user.sessions.id(payload.sid);
    if (!session) return next(httpError(401, 'Session revoked or expired', 'SESSION_REVOKED'));
    session.lastUsedAt = new Date();
    user.save().catch(() => {}); // best-effort
  }

  req.user = { id: payload.sub, role: payload.role, sid: payload.sid || null };
  next();
}

function httpError(status, message, code) {
  const e = new Error(message); e.status = status; if (code) e.code = code; return e;
}

module.exports = { authRequired };
```

### Refresh / rotation (§8)

```js
// controllers/auth.controller.js
async function refresh(req, res, next) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  let payload;
  try { payload = verifyRefreshToken(token); }
  catch { return res.status(401).json({ error: 'Invalid refresh token' }); }

  const user = await User.findById(payload.sub).select('+sessions');
  const session = user && payload.sid && user.sessions.id(payload.sid);
  if (!session) return res.status(401).json({ error: 'Session not found' });

  const ok = await bcrypt.compare(token, session.refreshTokenHash);
  if (!ok) {
    // Suspected reuse — kill *this* session only, not all of them.
    user.sessions.pull(session._id);
    await user.save();
    return res.status(401).json({ error: 'Session invalidated' });
  }

  const newRefresh = signRefreshToken(user, session._id);
  session.refreshTokenHash = await bcrypt.hash(newRefresh, 12);
  session.lastUsedAt = new Date();
  await user.save();

  res.cookie('refreshToken', newRefresh, refreshCookieOptions);
  res.json({ data: { user: user.toPublic(), accessToken: signAccessToken(user, session._id) } });
}
```

---

## 15. Reference implementation (this repo)

| Concept                                | File                                                                                          |
|----------------------------------------|-----------------------------------------------------------------------------------------------|
| Session sub-schema                     | `backend/src/models/User.js`                                                                  |
| Issue session                          | `backend/src/controllers/auth.controller.js` (`issueSessionAndReturnAccess`)                  |
| Per-request validation                 | `backend/src/middleware/auth.js`                                                              |
| Refresh / rotation                     | `backend/src/controllers/auth.controller.js` (`refresh`)                                      |
| Logout / per-session revoke / wipe-all | `backend/src/controllers/auth.controller.js` (`logout`, `revokeSession`, `revokeOtherSessions`) |
| JWT signing helpers                    | `backend/src/utils/tokens.js`                                                                 |
| Cookie options                         | `backend/src/utils/tokens.js` (`refreshCookieOptions`)                                        |
| Frontend store (in-memory access token) | `frontend/src/store/auth.store.ts`                                                            |
| Axios interceptor (401 → single-flight refresh) | `frontend/src/lib/api/client.ts`                                                       |
| Active sessions UI                     | `frontend/src/components/profile/SessionsList.tsx`                                            |
| Per-account login rate limiting        | `backend/src/middleware/rateLimits.js` (`loginPerEmailLimiter`)                               |

---

## 16. Translating to other stacks

| Concept (Node/Mongoose)                       | Postgres / Prisma                                  | FastAPI / SQLAlchemy                         | Go (Gin + GORM)                              |
|-----------------------------------------------|----------------------------------------------------|----------------------------------------------|----------------------------------------------|
| `user.sessions.create({...}); user.sessions.push(...); user.save()` | `prisma.session.create({ data: {...} })` | `db.add(Session(...)); db.commit()`        | `db.Create(&session)`                        |
| `user.sessions.id(sid)`                       | `prisma.session.findUnique({ where: { id, userId } })` | `db.query(Session).filter_by(id, user_id)` | `db.Where("id = ? AND user_id = ?", sid, uid).First(&session)` |
| `user.sessions.pull(sid)`                     | `prisma.session.delete({ where: { id } })`         | `db.delete(session); db.commit()`           | `db.Delete(&Session{}, "id = ?", sid)`       |
| `user.sessions = []`                          | `prisma.session.deleteMany({ where: { userId } })` | `db.query(Session).filter_by(user_id).delete()` | `db.Where("user_id = ?", uid).Delete(&Session{})` |
| `bcrypt.hash(tok, 12)`                        | same (`bcryptjs` Node-side or `pgcrypto` in DB)    | `bcrypt` / `passlib`                        | `golang.org/x/crypto/bcrypt`                 |
| Mongoose middleware with `async`              | Express middleware `async (req, res, next)`        | FastAPI `Depends(get_current_user)`         | Gin middleware returning `gin.HandlerFunc`   |

The pattern is portable verbatim. The only stack-specific decisions are:

- **Cookie API.** Most frameworks have an equivalent of `res.cookie('refreshToken', value, { httpOnly: true, secure, sameSite: 'lax', path: '/api/auth', maxAge })`.
- **JWT library.** Any library that supports `HS256` and arbitrary payload claims is fine — `jsonwebtoken` (Node), `python-jose` (Python), `golang-jwt/jwt/v5` (Go), `jose4j` (Java).
- **DB transactions.** Issuing a session and rotating a token are both single-document writes in Mongo (atomic by default). In SQL, wrap the session insert + cookie set in a serializable transaction if you're worried about replay races.

---

## 17. Glossary

- **Access token** — Short-lived JWT (15 min). Authorizes API calls. Lives in memory on the client.
- **Refresh token** — Long-lived JWT (7 days). Lives in an httpOnly cookie. Used only to mint new access tokens.
- **Session id (`sid`)** — The id of the row in the `sessions` table/array. Both JWTs carry it as a claim. Without it, the access token isn't revocable.
- **FIFO prune** — When the per-user session count exceeds the cap, drop the least-recently-used row.
- **Rotation** — Every successful `refresh` invalidates the old refresh hash and stores a fresh one. Stops replay of captured cookies.
- **Revocation** — Deleting the session row. Once deleted, any still-unexpired access token referencing its `sid` is rejected on the next protected request.
- **Device binding** — Optional upgrade where the request's UA/IP fingerprint is compared against what was recorded at session creation. Soft mode logs mismatches; hard mode revokes.
- **DPoP (RFC 9449)** — Demonstrating Proof-of-Possession. The client generates a key pair per session and signs each request. Stronger than session-bound JWT, more client-side work.

---

## Footnote

If you adopt this pattern, the smallest viable implementation is: §4 (schema), §6 (issue), §7 (validate), §8 (refresh), §9 (logout). Everything else — multi-device UI, FIFO prune, device-binding upgrade — is layered on top once the foundation is in place. Start small; the schema is the load-bearing decision.
