# Pokhara Tours and Travel — Project Documentation


> **Brand:** Logo in *Poppins* · primary `#0284c7` (sky-600) · accent `#fe8800`.

---

## Table of Contents

1. [What this project is](#1-what-this-project-is)
2. [Tech Stack](#2-tech-stack)
3. [Features at a glance](#3-features-at-a-glance)
4. [Repository layout](#4-repository-layout)
5. [Installation & setup](#5-installation--setup)
6. [Running the project](#6-running-the-project)
7. [Available commands](#7-available-commands)
8. [Environment variables](#8-environment-variables)
9. [Authentication & session model](#9-authentication--session-model)
10. [Booking flow](#10-booking-flow)
11. [Payment integration (eSewa)](#11-payment-integration-esewa)
12. [Admin panel](#12-admin-panel)
13. [AI features (Google Gemini)](#13-ai-features-google-gemini)
14. [Maintenance mode](#14-maintenance-mode)
15. [Security](#15-security)
16. [Caching & performance](#16-caching--performance)
17. [API surface](#17-api-surface)
18. [Database models](#18-database-models)
19. [Conventions & guardrails](#19-conventions--guardrails)
20. [Deployment notes](#20-deployment-notes)
21. [Known caveats](#21-known-caveats)
22. [Out of scope](#22-out-of-scope)

---

## 1. What this project is

A full-stack **MERN** marketing + booking website for **Pokhara Tours and Travel**, a Nepal-focused travel agency. Visitors can:

- Browse curated trekking, tour, adventure, cultural and wildlife packages.
- Search, filter by category, sort by price/date, paginate.
- Book a trip end-to-end with traveller count, date and payment method.
- Pay online via **eSewa** for advance bookings.
- Chat with an AI travel assistant grounded in the live catalog.
- Manage their profile, bookings, sessions, 2FA, and message history.

Admins additionally get a dedicated panel for users, packages, bookings, messages, analytics, and a sitewide maintenance toggle.

---

## 2. Tech Stack

### Frontend
- **Next.js 16** (App Router) — server components, ISR, route-level loading/error boundaries.
- **React 19** · **TypeScript 5**.
- **Tailwind CSS 4** — theme tokens in `globals.css` via `@theme inline` (no `tailwind.config.ts`).
- **Zustand 5** — global state (no `persist` for auth/session).
- **axios 1.15** — wrapped in one shared client with interceptors (`lib/api/client.ts`).
- **zod 4** + **react-hook-form 7** — typed validation.
- **framer-motion 12** — entry/hover animations.
- **lucide-react 1.14** — icons (brand glyphs come from `SocialIcons.tsx` inline SVGs).

### Backend
- **Node.js** + **Express 5.2** (CommonJS).
- **MongoDB Atlas** + **Mongoose 9.6** (`strict: true` everywhere).
- **jsonwebtoken 9** + **bcryptjs 3** (cost 12).
- **cookie-parser**, **cors**, **helmet**, **express-rate-limit**, **compression**, **morgan**, **dotenv 17**.
- **nodemailer 8** — Gmail SMTP via App Password.
- **@google/generative-ai** — Gemini SDK for AI features.

### Infrastructure
- **MongoDB Atlas** (DB) · **Gmail SMTP** (mail) · **Google Gemini** (AI) · **eSewa** (payment).
- Image hosts: Unsplash · Pexels · Picsum (allowlisted in `next.config.ts`). Admin-supplied URLs render with `<Image … unoptimized>`.

---

## 3. Features at a glance

### Public site
- **Home** — RSC-rendered newest 3 packages, offers prioritised, ISR every 5 min.
- **Destinations** — search · category filter · price/date sort · pagination · offers split into a top section · ISR every 5 min.
- **About / Contact / Privacy / Terms** — `force-static` legal pages.
- **Branded 404** with home CTA.

### Auth
- Register → email verify (24 h TTL) → login → silent refresh → logout.
- **In-memory access token** + **httpOnly refresh cookie** scoped to `/api/auth`.
- **Password change via 6-digit email OTP** (authenticated, single-shot, 10 min TTL).
- **Forgot-password reset link** (unauthenticated, 256-bit token, 60 min TTL, single-shot; success wipes all sessions).
- **TOTP-based 2FA** (RFC 6238, Google-Authenticator-compatible).
- **Multi-device session management** — every login is bound to a `User.sessions[]` row (`deviceLabel`, `ip`, `userAgent`, `lastUsedAt`); JWTs carry an `sid` claim. Capped at 10 sessions per user (FIFO prune).
- 401 mid-session triggers a single-flight `/refresh` + retry.

### Profile
- Account info · edit name · OTP-confirmed password change · enable/disable 2FA · active-sessions list (revoke individual devices or "sign out everywhere else") · my bookings (with self-service cancel ≥ 24 h ahead) · my messages (with admin reply thread).

### Admin panel (`/admin/*`)
- **Dashboard** — live counts, 30-day revenue, 5 most-recent bookings (30 s in-memory cache).
- **Users** — paginated, regex-escaped search, role toggle, delete.
- **Packages** — CRUD with category enum + `isOffer` toggle, gallery up to 5 URLs.
- **Bookings** — search + filters, mark paid, confirm/cancel, delete.
- **Messages** — search + filter, reply via SMTP (appended to a thread).
- **Settings** — sitewide maintenance toggle.

### Booking flow
- Native date picker (`min={today}`) · traveller stepper · pre-filled contact · payment-method radio · sticky live summary.
- Children priced at 50%; total **always recomputed server-side**.
- Booking persists a snapshot of `{ title, priceNPR, coverImage }` so historical bookings don't drift if the package is later edited.
- **Self-service cancel** when start date is ≥ 24 h away.
- **Online payment via eSewa** for `advance` bookings.

### AI features (Google Gemini)
- **AI recommendations** — home page "Recommended / Trending" section (popularity + category affinity + Gemini rerank).
- **Travel chatbot** — global floating widget grounded in the live catalog; supports inline "View package" chips via a `[SUGGEST: slug,…]` tag.
- **Itinerary generator** — per-package day-by-day plan tailored to `{ days, adults, children }`, cached per shape on the Package doc (FIFO cap 20).
- **Best-season note** — short timing/weather tip per package.
- **Semantic search** — keyword prefilter → Gemini rerank → 0-100 relevance score + reason.
- **Similar packages** — deterministic scorer (category + price bucket + popularity + offer), never calls Gemini.
- **Graceful degradation** — every AI endpoint returns a useful fallback if `GEMINI_API_KEY` is missing or Gemini is unreachable.

### Maintenance mode
- Admin toggle blocks the public site (frontend gate + backend `503` middleware). `/admin/*` and `/login` always remain reachable.

---

## 4. Repository layout

```
pokhara-tours-and-travel/

├── documentation.md            (this file)
├── backend/                    Express API (CommonJS)
│   └── src/
│       ├── server.js           boot + .env validation
│       ├── app.js              helmet · cors · maintenance gate · routes · errorHandler
│       ├── config/db.js        mongoose.connect()
│       ├── controllers/        auth · admin · packages · bookings · contact · settings · ai · ...
│       ├── models/             User · Package · Booking · ContactMessage · Settings · ...
│       ├── middleware/         auth · rateLimits · maintenanceCheck · errorHandler · notFound
│       ├── routes/             one router file per resource
│       ├── services/ai/        gemini.client · popularity.service · prompts
│       ├── scripts/            seedPackages.js (20 regular + 10 offers, idempotent)
│       └── utils/              tokens · mailer · validators · slugify
└── frontend/                   Next.js 16 SPA (App Router, TS)
    └── src/
        ├── app/                routes (public · auth-gated · admin-gated)
        ├── components/         layout · home · forms · auth · profile · admin · packages · booking · ai · ui
        ├── lib/api/            axios client + per-resource service files
        ├── lib/validators/     zod schemas
        ├── store/              auth.store.ts (no persist)
        └── types/              shared TS contracts
```

---

## 5. Installation & setup

### Prerequisites
- **Node.js 20+**
- **MongoDB Atlas** cluster (or local MongoDB)
- A **Gmail** account with **2FA enabled** and an **App Password** ([generate here](https://myaccount.google.com/apppasswords))
- *(Optional)* **Google AI Studio** API key for Gemini features
- *(Optional)* **eSewa** sandbox merchant credentials for online payments

### Step 1 — Clone and install
```bash
git clone <repo-url>
cd "pokhara-tours-and-travel"

cd backend  && npm install
cd ../frontend && npm install
```

### Step 2 — Configure environment

**`backend/.env`** (copy from `.env.example`):
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_ACCESS_SECRET=<96-char hex>
JWT_REFRESH_SECRET=<different 96-char hex>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
EMAIL_VERIFY_TTL_HOURS=24

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@gmail.com
SMTP_PASS=<16-char Gmail App Password>
SMTP_FROM_NAME=Pokhara Tours and Travel

# Optional — endpoints fall back to non-AI responses if missing
GEMINI_API_KEY=<your AI Studio key>

# Required for advance-booking online payment
ESEWA_MERCHANT_CODE=<merchant code>
ESEWA_SECRET_KEY=<HMAC secret>
ESEWA_PAYMENT_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_STATUS_URL=https://rc.esewa.com.np/api/epay/transaction/status/
ESEWA_SUCCESS_URL=http://localhost:3000/booking/esewa/success
ESEWA_FAILURE_URL=http://localhost:3000/booking/esewa/failure
```

> `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `CLIENT_URL` are validated at startup — the process exits if any is missing.

**`frontend/.env.local`** (copy from `.env.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Pokhara Tours and Travel
```

### Step 3 — Seed the database (optional but recommended)
```bash
cd backend
node src/scripts/seedPackages.js
```
Idempotent upsert by slug — re-running updates existing packages (including gallery & category).

### Step 4 — Promote an account to admin
After registering and verifying your email, in Mongo shell or Atlas data-explorer:
```js
db.users.updateOne({ email: 'you@example.com' }, { $set: { role: 'admin' } })
```
Log out and back in — `/admin/*` is yours.

---

## 6. Running the project

Open two terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev          # http://localhost:5000

# Terminal 2 — frontend
cd frontend && npm run dev         # http://localhost:3000
```

Browse to `http://localhost:3000`.

---

## 7. Available commands

### Backend (`cd backend`)
| Command                            | Purpose                              |
|------------------------------------|--------------------------------------|
| `npm run dev`                      | nodemon, watches `src/`              |
| `npm start`                        | production                           |
| `node src/scripts/seedPackages.js` | seed 30 Nepal packages (idempotent)  |

### Frontend (`cd frontend`)
| Command            | Purpose                                              |
|--------------------|------------------------------------------------------|
| `npm run dev`      | Next dev server                                      |
| `npm run build`    | production build                                     |
| `npm start`        | run built app                                        |
| `npm run lint`     | ESLint                                               |
| `npx tsc --noEmit` | type-check (run before declaring a task done)        |

---

## 8. Environment variables

### Backend
| Var | Purpose |
|-----|---------|
| `NODE_ENV` | `development` / `production` — toggles cookie `secure`, error.code, morgan format |
| `PORT` | Express port (default `5000`) |
| `CLIENT_URL` | Frontend origin allowed by CORS + used in verification email links |
| `MONGO_URI` | Atlas / local connection string |
| `JWT_ACCESS_SECRET` | 96-char hex; sign/verify access JWTs |
| `JWT_REFRESH_SECRET` | Different 96-char hex; sign/verify refresh JWTs |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `EMAIL_VERIFY_TTL_HOURS` | Optional. Default `24` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | `smtp.gmail.com` / `465` / `true` |
| `SMTP_USER` / `SMTP_PASS` | Gmail address + 16-char App Password |
| `SMTP_FROM_NAME` | Display name on outgoing mail |
| `GEMINI_API_KEY` | Optional. Missing → AI endpoints serve fallbacks |
| `ESEWA_MERCHANT_CODE` | eSewa merchant/product code in signed payload |
| `ESEWA_SECRET_KEY` | HMAC-SHA256 secret for eSewa payload signatures |
| `ESEWA_PAYMENT_URL` | eSewa form endpoint user is redirected to |
| `ESEWA_STATUS_URL` | eSewa transaction-status check endpoint |
| `ESEWA_SUCCESS_URL` / `ESEWA_FAILURE_URL` | Frontend return URLs |

### Frontend
| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_APP_NAME` | `Pokhara Tours and Travel` |

---

## 9. Authentication & session model

The strongest practical SPA auth pattern: **in-memory access token + httpOnly refresh cookie + session-bound JWT**.

### Tokens at a glance
| Token | TTL | Storage | Sent how |
|-------|-----|---------|----------|
| Access JWT | 15 min | Zustand state — **never on disk** | `Authorization: Bearer <token>` |
| Refresh JWT | 7 days | `HttpOnly + Secure(prod) + SameSite=Lax` cookie, path `/api/auth` | Browser auto-attaches |
| Refresh hash | persistent | bcrypt-hashed on the matching row in `User.sessions[]` (cost 12) | Server-side only |

### Why session-bound JWT
Both tokens carry an `sid` claim that points at a row in `User.sessions[]`. **Every protected request** re-validates `sid` against the session table, so logout, password reset, "sign out everywhere", and per-device revoke kill the still-unexpired access token on its very next use.

### Key flows
- **Register** — user saved with `isEmailVerified: false`, verification email sent. No tokens issued.
- **Login** — credentials verified → new session row created (with `userAgent`, `ip`, `deviceLabel`) → both JWTs signed with the same `sid` → refresh stored as bcrypt hash → FIFO prune to 10 sessions per user → refresh cookie set, access token returned in JSON.
- **Cold reload** — `<AuthHydrator />` mounts → `auth.store.hydrate()` → `POST /api/auth/refresh` → store repopulated if a valid refresh cookie is present.
- **401 mid-session** — axios response interceptor calls `/refresh` (single-flight to avoid two-tab races) → retries original request.
- **Logout** — store cleared optimistically, then refresh cookie + that session's DB hash are revoked.
- **Refresh rotation** — every `/refresh` invalidates the old hash and stores a fresh one for that session only. A mismatched hash wipes just that one session.

### Password change (authenticated, OTP-confirmed)
1. `POST /api/auth/change-password/request` — verify current password → email 6-digit OTP (10 min TTL, bcrypt-hashed at cost 12).
2. `POST /api/auth/change-password/confirm` — validate `^\d{6}$`, password strength, expiry, bcrypt-compare. **Single-shot:** the OTP is cleared after every attempt; a typo means request a new one.

### Forgot-password (unauthenticated reset link)
1. `POST /api/auth/forgot-password` — always returns `200 { ok: true }` (avoids leaking which emails are registered). For verified accounts: generate 32-byte hex token → bcrypt-hash → 60 min expiry → email link to `${CLIENT_URL}/reset-password?token=&id=`.
2. `POST /api/auth/reset-password` — validate `{ token, id, newPassword }`. Single-shot. On success: set new password **and clear `User.sessions[]` entirely** (any compromised device loses access).

### Two-factor authentication (TOTP, RFC 6238)
Optional per-user. Login becomes a 2-stage flow: credentials → signed challenge token → 6-digit TOTP code → session. Compatible with Google Authenticator.

### Multi-device sessions
- Every login = a new `User.sessions[]` row with its own `sid`.
- Profile shows active sessions; users can revoke any device or "sign out everywhere else".
- Cap of **10 sessions per user**; the 11th login FIFO-prunes the oldest (by `lastUsedAt`).


---

## 10. Booking flow

End-to-end booking journey from browse to confirmation:

1. **Browse** — Visitor opens `/destinations` (server-rendered, ISR every 5 min). Search, filter by category, sort by price/date, paginate.
2. **Open dialog** — Click a card → lazy-loaded `<PackageDetailDialog>` with image slider, description, and **Book this trip** CTA.
3. **Auth gate**:
   - Not logged in → `/login?next=/booking?package=<slug>` → after login, lands on the booking page.
   - Logged in → straight to `/booking?package=<slug>`.
4. **Fill the form** (`/booking`):
   - Native `<input type="date">` with `min={today}`.
   - Traveller stepper (adults 1–20, children 0–20).
   - Contact info pre-filled from profile.
   - Payment method radio: **advance** (pay online via eSewa) or **on_arrival** (cash).
   - Notes (optional).
   - Sticky **`<BookingSummary>`** shows the package cover, line items, and total NPR live.
5. **Submit** — `POST /api/bookings`:
   - Server validates date ≥ today.
   - Looks up the package.
   - Recomputes `totalNPR = adults × priceNPR + children × Math.round(priceNPR / 2)`.
   - Snapshots `{ title, priceNPR, coverImage }` onto the booking so historical bookings don't drift.
   - Persists.
6. **Confirmation card** — inline success with booking id, summary, payment-method-specific copy, and CTAs to `/profile` and `/destinations`.
7. **Online payment** (advance bookings only) — see [§11](#11-payment-integration-esewa).
8. **Profile → My bookings** — every booking shown with snapshot title, total NPR, status chip + payment-status chip. **Self-service cancel** is available when start date is ≥ 24 h away.
9. **Admin** sees the booking in `/admin/bookings` with action buttons to mark paid, confirm, cancel, or delete. The dashboard cache busts on any of these writes.

### Pricing rules
- `total = adults × priceNPR + children × Math.round(priceNPR / 2)`.
- **Always recomputed server-side** before persisting — the client value is only for live preview.

### Validation rules
| Field | Rule |
|-------|------|
| `startDate` | ≥ today (server-enforced) |
| `adults` | 1–20 |
| `children` | 0–20 |
| `paymentMethod` | `advance` \| `on_arrival` |
| Contact `email` | valid email, ≤ 200 chars |
| Contact `phone` | `/^\+?[0-9][0-9\-\s()]{5,19}$/` |

---

## 11. Payment integration (eSewa)

eSewa is wired for `advance` bookings only. Cash-on-arrival is still admin-marked.

### Flow
1. User clicks **Pay with eSewa** on a freshly created `advance` booking.
2. `POST /api/bookings/:id/esewa-init` — server builds the eSewa payload, signs it with `ESEWA_SECRET_KEY` (HMAC-SHA256), returns redirect form fields.
3. Frontend submits the form to `ESEWA_PAYMENT_URL` → user lands on eSewa.
4. After payment, eSewa redirects to `ESEWA_SUCCESS_URL` or `ESEWA_FAILURE_URL` with a signed callback.
5. `POST /api/bookings/esewa-verify` — server verifies the signature, then server-to-server checks `ESEWA_STATUS_URL` to confirm the transaction settled.
6. On confirmed success: `Booking.paymentStatus = 'paid'`.
7. Frontend polls `/api/bookings/me/:id` after the redirect to render the latest status.

### Security notes
- Both legs (init + verify) are HMAC-signed — the eSewa redirect is the auth for the verify endpoint.
- Status is **always re-checked server-to-server** against `ESEWA_STATUS_URL` before flipping `paymentStatus`, so a forged callback alone can't mark a booking paid.
- Admin can still manually flip `paymentStatus` for cash bookings.

### Deferred
- **Khalti** / Stripe / international card gateways are out of scope today.

---

## 12. Admin panel

Mounted at `/admin/*`. Gated by `<ProtectedRoute requireRole="admin">` (frontend) AND `authRequired + adminOnly` middleware (backend).

| Section | What it does |
|---------|--------------|
| **Dashboard** | 4 stat cards (users, packages, bookings 30 d, revenue 30 d) + 5 most-recent bookings list. 30 s in-memory cache; busted on any booking write. |
| **Users** | Paginated table with regex-escaped search, role toggle, delete. Self-edit blocked. |
| **Packages** | Full CRUD via lazy-loaded `<PackageFormDialog>` — title, description, priceNPR, gallery (≤ 5 URLs), `isOffer`, `category` enum. |
| **Bookings** | Search + status + paymentStatus filters; mark-paid, confirm/cancel, delete. |
| **Messages** | Search + status filter; row click opens lazy detail dialog with reply thread; new replies sent via Gmail SMTP. |
| **Settings** | Maintenance toggle + custom message. Server-side enforced via `maintenanceCheck` middleware. |

### Role gating
`User.role` is `'user' | 'admin'`, default `'user'`. To promote:
```js
db.users.updateOne({ email: 'me@example.com' }, { $set: { role: 'admin' } })
```
The new role flows into the access JWT on the next login or `/refresh`.

The `/profile` page hides the bookings + messages sections for admins (admins don't book trips; admins reply to messages from `/admin/messages`).

---

## 13. AI features (Google Gemini)

The AI layer is a **product enhancement, not a dependency** — every endpoint ships a deterministic fallback. The site behaves identically when `GEMINI_API_KEY` is missing, the quota is exhausted, or the network call fails.

### Stack
- **SDK:** `@google/generative-ai` (Node).
- **Models:** primary `gemini-2.5-flash`, fallback `gemini-flash-lite-latest`. The client retries on quota errors (`/429|quota|rate.?limit/i`) before falling through to the route-level fallback.
- **Modes:** `generateText`, `generateJSON` (with `responseMimeType: 'application/json'`), `generateChat`.

### Features
1. **AI recommendations** (`POST /api/ai/recommendations`) — Pulls popularity (top-20 most-booked), category affinity for logged-in users, and excludes already-booked slugs. Gemini picks the top N in JSON mode with a one-line reason. Fallback: popularity-sorted list with a canned reason.
2. **Travel chatbot** (`POST /api/ai/chat`) — Multi-turn; last 10 turns sent, each clamped to 500 chars. System prompt contains the full live catalog. Replies may include `[SUGGEST: slug1, slug2]` tags rendered as inline "View package" chips. Fallback: canned reply + `aiEnabled: false`.
3. **Itinerary generator** (`POST /api/ai/itinerary/:slug`) — Input `{ days (1–14), adults, children }`. Cached on `Package.aiItineraryCache[]` keyed by `<days>d-<adults>a[-<children>c]`, FIFO cap 20. Fallback: generic Arrival → Exploration → Return scaffold.
4. **Best-season note** (`GET /api/ai/best-season/:slug`) — Short timing/weather tip, cached on `Package.aiBestSeasonNote`. Fallback: "September through November" canned note.
5. **Semantic search** (`POST /api/ai/search`) — Regex-OR keyword pre-filter (top 20) → Gemini rerank with `{ slug, score (0–100), reason }`. Fallback: keyword matches with `score: 50`.
6. **Similar packages** (`GET /api/ai/similar/:slug`) — Pure heuristic, **no AI call**. Scores by category (+50), price bucket (+25), price delta (≤ +15), popularity (≤ +20), `isOffer` (+5). Returns top 3.

### Security & hygiene
- All AI routes use `authOptional` — anonymous works; logged-in unlocks personalization.
- Rate limits: `aiLimiter` 20/min on heavier endpoints, `aiChatLimiter` 8/min on `/chat`.
- Chat input hard-clamped (10 turns × 500 chars each).
- Semantic-search query clamped at 200 chars; tokens regex-escaped before pre-filter.
- Suggestion tags validated against the live catalog — the model cannot inject arbitrary URLs.
- Any Gemini error → log `console.warn` + return fallback shape; the UI never breaks.

### Caching
| Surface | Where | TTL / size |
|---------|-------|------------|
| Popularity / affinity / seasonal | `services/ai/popularity.service.js` module map | 5 min in-memory |
| Itinerary plans | `Package.aiItineraryCache[]` | Persistent; FIFO cap 20 / package |
| Best-season note | `Package.aiBestSeasonNote` | Persistent (single string) |
| Generative-model handles | `services/ai/gemini.client.js` memo | Process-lifetime |

---

## 14. Maintenance mode

A singleton `Settings` document (`{ key: 'global', maintenanceMode, maintenanceMessage }`) drives a sitewide kill-switch.

### Backend enforcement (`middleware/maintenanceCheck.js`)
- Looks up the singleton on every request (creates on first call).
- Exempt prefixes: `/api/health`, `/api/auth/login|refresh|logout`, `/api/admin/*`, `/api/settings`. These always pass through so admins can recover mid-outage.
- For non-exempt requests when `maintenanceMode === true`: cheaply decodes the access token. Returns `503 { error, code: 'MAINTENANCE' }` unless `role === 'admin'`.
- **Fails open** on Settings load errors so a DB hiccup doesn't block traffic.

### Frontend gate (`components/auth/MaintenanceGate.tsx`)
- Wraps Navbar + main + Footer in `app/layout.tsx`.
- Polls `/api/settings` on mount and every 60 s.
- Always passes through admins, `/admin/*`, and `/login`.
- Otherwise renders a full-takeover maintenance screen with the custom message.

**Defense in depth:** the backend middleware is the source of truth — disabling JS or hitting the API directly still returns `503`.

---

## 15. Security

| Concern | Mitigation |
|---------|-----------|
| HTTP headers | `helmet()` at the top of `app.js` (X-Content-Type-Options, X-Frame-Options, HSTS, …) |
| Compression | `compression()` after helmet |
| Access logs | `morgan('dev')` in dev / `'combined'` in prod |
| Trust proxy | `app.set('trust proxy', 1)` so rate limiters + IP logic see the real client |
| Body size | `express.json({ limit: '50kb' })` |
| CORS | `origin: process.env.CLIENT_URL`, `credentials: true` |
| Env validation | `server.js` exits if any required var is missing |
| Rate limiting | Per-endpoint (`express-rate-limit`): login **10 / 15 min**, register **5 / h**, resend-verify **3 / h**, password-change **5 / h**, `passwordResetLimiter` **5 / h**, contact **5 / h**, newsletter **3 / h**, `aiLimiter` **20 / min**, `aiChatLimiter` **8 / min** |
| ReDoS protection | `escapeRegex` on every admin `$regex` filter; `q` clamped to 100 chars |
| Password hashing | bcrypt **cost 12** (passwords, refresh-token hashes, email-verify hashes, password-change OTPs) |
| Secret leakage | `User.toJSON` strips `passwordHash`, `refreshTokenHash`, `emailVerifyTokenHash`, `passwordChangeOtpHash`, `passwordResetTokenHash`, etc. |
| Schema hygiene | Every Mongoose model uses `strict: true` — unknown body fields are dropped |
| Error sanitisation | `errorHandler` hides `err.code` in production (only `EMAIL_NOT_VERIFIED`, `VERIFY_EXPIRED`, `OTP_EXPIRED`, `RESET_EXPIRED`, `MAINTENANCE` are surfaced intentionally) |
| Token storage | Access token **in memory only** (Zustand, no `persist`). Refresh token httpOnly + Secure(prod) + SameSite=Lax cookie, path-scoped to `/api/auth`. No tokens in `localStorage`, ever. |
| Session revocation | Stateful `sid` check on every protected request — logout/reset/revoke kills still-unexpired access tokens immediately |
| CSRF | Authorization-header model + path-scoped refresh cookie + SameSite=Lax → no CSRF token middleware needed |
| Booking total tampering | `totalNPR` always recomputed server-side from `priceNPR × travelers` |
| eSewa payments | HMAC-SHA256 on init + callback; status re-checked server-to-server before flipping `paymentStatus: 'paid'` |
| Email enumeration | `POST /api/auth/forgot-password` always returns 200, regardless of whether the email exists |

### Password rules (server-side + mirrored on the client)
- 8–256 characters.
- At least 1 uppercase, 1 lowercase, 1 number, 1 special character.

---

## 16. Caching & performance

| Surface | Strategy |
|---------|----------|
| `/` and `/destinations` | RSC with `revalidate: 300` (ISR every 5 min). Initial packages passed as props so the client component skips its `useEffect` fetch. |
| `/api/packages` | `Cache-Control: public, max-age=60, stale-while-revalidate=300` on list + getBySlug. |
| Admin dashboard | 30-second module-level in-memory cache; busted on booking status / payment / delete writes. |
| `MaintenanceGate` | Polls `/api/settings` on mount + every 60 s. |
| Legal pages | `export const dynamic = 'force-static'` on `/about`, `/contact`, `/privacy`, `/terms`, `/not-found`. |
| Lazy dialogs | `next/dynamic` with `ssr: false` on `PackageDetailDialog`, `PackageFormDialog`, `MessageDetailDialog` — they never appear until clicked. |
| Loading / error boundaries | `loading.tsx` + `error.tsx` at `/admin` and `/destinations` for streaming Suspense + route-level recovery. |
| Search debounce | `useDebounce(value, 250)` on the destinations search input. |

### DB indexes
- `Booking`: `{ user, packageSlug }`, `{ createdAt: -1 }`, `{ user: 1, createdAt: -1 }`
- `Package`: `{ slug }`, `{ isOffer }`, `{ category }`, `{ isOffer: -1, createdAt: -1 }`, `{ category: 1, createdAt: -1 }`
- `User`: `{ email }`, `{ username }`, `{ phone }` unique + `{ role, isEmailVerified, emailVerifyTokenExpires }` TTL
- `ContactMessage`: `{ status, user }`

### Image policy
- **Curated** (heroes, About, login panels): Unsplash / Pexels URLs via `<Image>` with the optimizer; hosts allowlisted in `next.config.ts`.
- **Admin-supplied** (Package gallery): arbitrary URLs — render with `<Image … unoptimized>`.
- **Seed data**: `picsum.photos` (already allowlisted).
- **No `<img>` tags. No upload pipeline.**

---

## 17. API surface

Base URL: `process.env.NEXT_PUBLIC_API_URL` → `http://localhost:5000` in dev.

### Auth (`/api/auth`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/register` | none | `201` + verification email |
| `POST` | `/login` | none | `200 { user, accessToken }` + refresh cookie |
| `POST` | `/login/2fa` | challenge token | exchange TOTP code → session |
| `GET`  | `/verify-email` | none | auto-login on success |
| `POST` | `/resend-verification` | none | always returns 200 |
| `POST` | `/refresh` | refresh cookie | rotates hash; returns new access token |
| `POST` | `/logout` | refresh cookie | clears cookie + session row |
| `GET`  | `/me` | Bearer | current user |
| `PATCH`| `/me` | Bearer | `{ name }` |
| `POST` | `/change-password/request` | Bearer | sends 6-digit OTP |
| `POST` | `/change-password/confirm` | Bearer | `{ otp, newPassword }` |
| `POST` | `/forgot-password` | none | always 200 |
| `POST` | `/reset-password` | none | wipes all sessions on success |
| `POST` | `/2fa/setup` / `/2fa/enable` / `/2fa/disable` | Bearer | TOTP lifecycle |
| `GET`  | `/sessions` | Bearer | list active devices |
| `DELETE` | `/sessions/:id` | Bearer | revoke a device |
| `DELETE` | `/sessions` | Bearer | "sign out everywhere else" |

### Public
| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/api/health` | service heartbeat |
| `GET`  | `/api/packages` | list, sorted newest, cached |
| `GET`  | `/api/packages/:slug` | detail, cached |
| `GET`  | `/api/settings` | `{ maintenanceMode, maintenanceMessage }` only |
| `POST` | `/api/contact` | `authOptional` — links to user when logged in |
| `GET`  | `/api/contact/me` | user's submitted messages with reply threads |
| `POST` | `/api/newsletter` | upsert by email |

### Bookings (`/api/bookings`, auth required)
| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/bookings` | server validates + recomputes total + snapshots package |
| `GET`  | `/api/bookings/me` | current user's bookings |
| `GET`  | `/api/bookings/me/:id` | single booking |
| `PATCH`| `/api/bookings/me/:id/cancel` | self-service cancel (≥ 24 h ahead) |
| `POST` | `/api/bookings/:id/esewa-init` | signed init payload |
| `POST` | `/api/bookings/esewa-verify` | signed callback (eSewa signature is the auth) |

### AI (`/api/ai`, `authOptional`, rate-limited)
- `POST /api/ai/recommendations`
- `POST /api/ai/chat`
- `POST /api/ai/itinerary/:slug`
- `GET  /api/ai/best-season/:slug`
- `POST /api/ai/search`
- `GET  /api/ai/similar/:slug`

### Admin (`/api/admin`, `authRequired + adminOnly`)
- `/api/admin/users` — list / role / delete
- `/api/admin/packages` — list / create / update / delete
- `/api/admin/bookings` — list / get / status / payment / delete
- `/api/admin/messages` — list / get / read / reply / delete
- `/api/admin/analytics/overview` — dashboard data
- `/api/admin/settings` — maintenance toggle

### Response envelope
```ts
type ApiSuccess<T> = { data: T; message?: string };
type ApiError     = { error: string; code?: string };  // code stripped in production
```

---

## 18. Database models

(All schemas use `strict: true`. Secrets stripped via schema-level `toJSON.transform`.)

| Model | Notable fields |
|-------|----------------|
| **User** | `name`, `username`, `email`, `phone`, `passwordHash`, `role`, `isEmailVerified`, `emailVerifyTokenHash`, `passwordChangeOtpHash`, `passwordResetTokenHash`, `totpSecret`, `sessions[]` (embedded sub-schema with `refreshTokenHash`, `userAgent`, `ipAddress`, `deviceLabel`, `lastUsedAt`) |
| **Package** | `slug`, `title`, `description`, `priceNPR`, `gallery[]` (≤ 5), `isOffer`, `category` enum (`trek` \| `tour` \| `adventure` \| `cultural` \| `wildlife`), `aiBestSeasonNote`, `aiItineraryCache[]` |
| **Booking** | `user`, `packageSlug`, `startDate`, `travelers { adults, children }`, `contact { name, email, phone }`, `paymentMethod`, `paymentStatus`, `status`, `totalNPR`, `packageSnapshot { title, priceNPR, coverImage }`, `notes` |
| **ContactMessage** | `name`, `email`, `subject`, `message`, `status` (`new` / `read` / `replied`), `replies[]`, optional `user` link |
| **Settings** | Singleton (`key: 'global'`); `maintenanceMode`, `maintenanceMessage` |
| **NewsletterSubscriber** | `email` (unique) |

---

## 19. Conventions & guardrails

- **No axios outside `frontend/src/lib/api/`.** Components and pages call services or stores.
- **No global state outside `frontend/src/store/`.** Zustand stores are flat and never import each other.
- **No business logic in `frontend/src/app/*`.** Pages compose components and call stores.
- **No `<img>`.** `next/image` everywhere; `unoptimized` for arbitrary admin URLs.
- **No `any` in TypeScript.** Use `unknown` and narrow.
- **No `$regex` from raw `req.query`.** Run input through `escapeRegex()` and clamp length.
- **No tokens in `localStorage`** in any form.
- **No comments restating what code does.** WHY-only, when non-obvious.
- **Tailwind v4** — theme tokens live in `globals.css` under `@theme inline` (no `tailwind.config.ts`).
- **Strict schemas** — every Mongoose model uses `strict: true`.
- **Never trust client totals** — server always recomputes `totalNPR`.

---

## 20. Deployment notes

| Layer | Recommended host | Notes |
|-------|------------------|-------|
| **Frontend** | Vercel | Set `NEXT_PUBLIC_API_URL` in project env. ISR works out of the box. |
| **Backend**  | Render / Railway / Fly.io | Long-lived Node process. Set every backend env var listed above. Ensure `trust proxy 1` matches your hop count. |
| **DB**       | MongoDB Atlas | Whitelist the backend host's outbound IPs. |
| **Mail**     | Gmail App Password | Or swap `SMTP_*` to any provider (SendGrid, Mailgun, etc.). |
| **AI**       | Google AI Studio | Free tier is sufficient for development. Leave `GEMINI_API_KEY` blank to disable. |

Production checklist:
- `NODE_ENV=production` → enables `Secure` cookies and hides `err.code` responses.
- HTTPS everywhere (cookies are `Secure` in prod).
- Set `CLIENT_URL` to your real frontend origin.
- Rotate `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — a rotation invalidates all sessions (intentional).
- Run `seedPackages.js` once after first deploy.
- Promote your account to `admin` in the DB.

---

## 21. Known caveats

- **Inner git repo trap** — `create-next-app` initialises `frontend/.git`. If you re-bootstrap the frontend, delete `frontend/.git` immediately, or GitHub will see only an empty submodule pointer.
- **Lucide brand glyphs are removed** (Facebook, Twitter, Instagram, etc.). Use `frontend/src/components/layout/SocialIcons.tsx` (inline SVGs).
- **Admin-supplied gallery URLs** must be rendered with `<Image … unoptimized>` — Next throws otherwise.
- **Password-change OTP is single-shot** by design. A wrong code invalidates it — request a new one.
- **ISR lag** — package edits via `/admin/packages` don't appear on `/destinations` until the 5-min revalidation expires. Call `revalidatePath('/destinations')` from the admin controller if you need instant freshness.
- **Gmail SMTP requires an App Password**, not your normal Google login (2FA must be enabled first).
- **AI runs in graceful-degradation mode** — every `/api/ai/*` endpoint returns a sensible non-AI response when Gemini is missing or unreachable.
- **AI itinerary cache is per-package, not per-user** — two users with the same `{days, adults, children}` shape share the same plan (cap 20 entries per package, FIFO).
- **`MONGO_URI` is space-sensitive** — `MONGO_URI=...` (no space before `=`).

---

## 22. Out of scope

- **Khalti** / Stripe / international card gateways (eSewa only today).
- Date *ranges* (start + end) — single date only.
- i18n (English / Nepali) — `next-intl` planned later.
- Image upload pipeline / Cloudinary — online URLs only.
- Inbound email parsing for replies to admin messages.
- Booking confirmation email — mailer is wired but the template is deferred.

---

