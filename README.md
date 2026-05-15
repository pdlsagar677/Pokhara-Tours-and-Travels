# Pokhara Tours and Travel

A full-stack MERN booking website for **Pokhara Tours and Travel**, a Nepal-focused travel agency. Visitors can browse curated trekking, tour, adventure, cultural and wildlife packages, book a trip end-to-end, and message the team. Admins manage everything from a dedicated panel.

> **Brand:** Logo set in *Poppins* · primary `#0284c7` (sky-600) · accent `#fe8800`.

---

## Tech stack

**Frontend** — Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · Zustand 5 · axios · zod · react-hook-form · framer-motion 12 · lucide-react

**Backend** — Node.js · Express 5 · MongoDB Atlas · Mongoose 9 · jsonwebtoken · bcryptjs · cookie-parser · helmet · express-rate-limit · compression · morgan · nodemailer · @google/generative-ai

**Infra** — MongoDB Atlas (DB) · Gmail SMTP via App Password (mail) · Google Gemini (AI: `gemini-2.5-flash` primary + `gemini-flash-lite-latest` fallback) · Unsplash / Pexels / Picsum (curated images) · arbitrary admin URLs rendered `unoptimized`.

---

## Features

### Public site
- **Home** — RSC-rendered newest 3 packages, offer-prioritised, ISR every 5 min.
- **Destinations** — search, category filter, price/date sort, pagination, offers split into a top section, ISR every 5 min.
- **About / Contact / Privacy / Terms** — `force-static` legal/info pages.
- **Branded 404** with home CTA.

### Auth
- Register → email verify (24 h TTL) → login → silent refresh → logout.
- **In-memory access token** (Zustand) + **httpOnly refresh cookie** scoped to `/api/auth`.
- **Password change via 6-digit email OTP** (authenticated, from `/profile`) — single-shot, 10 min TTL.
- **Forgot-password reset link** (unauthenticated) — `POST /api/auth/forgot-password` emails a signed link to `/reset-password?token=&id=`. Single-shot, 60 min TTL, success wipes all sessions so a compromised device loses access.
- **TOTP-based 2FA** (RFC 6238, Google-Authenticator-compatible). Optional per-user. Login becomes a 2-stage flow: credentials → signed challenge token → 6-digit TOTP → session.
- **Multi-device session management** — every login is bound to a `User.sessions[]` row (`deviceLabel`, `ip`, `userAgent`, `lastUsedAt`); JWTs carry an `sid` claim. Cap 10 sessions per user (oldest pruned). Refresh rotates only the matched session's hash.
- 401 mid-session triggers a single-flight `/refresh` + retry.

### Profile
- Account info · edit name · OTP-confirmed password change · **enable / disable 2FA** · **active-sessions list** (revoke individual devices or "sign out everywhere else") · my bookings (with self-service cancel) · my messages (with admin reply thread).

### Booking flow
- Native date picker (min = today) · traveller stepper · pre-filled contact · payment-method radio · sticky live summary.
- Children priced at 50%; total **always recomputed server-side**.
- Booking persists a snapshot of `{ title, priceNPR, coverImage }` so historical bookings don't drift if the package later changes.
- **Self-service cancel** from `/profile → My bookings` when start date is ≥ 24 h away — server enforces the lead-time rule.
- **Online payment via eSewa** for `advance` bookings: signed init → gateway redirect → signed verify callback → server-side status check → `paymentStatus: 'paid'`.

### Admin panel (`/admin/*`)
- **Dashboard** — live counts, 30-day revenue, 5 most-recent bookings (30 s in-memory cache).
- **Users** — paginated, regex-escaped search, role toggle, delete.
- **Packages** — CRUD with category enum + `isOffer` toggle, gallery up to 5 URLs.
- **Bookings** — search + filters, mark paid, confirm/cancel, delete.
- **Messages** — search + filter, reply via SMTP (appended to a thread).
- **Settings** — sitewide maintenance toggle.

### AI features (Google Gemini)
- **AI recommendations** — home page "Recommended for you / Trending across Nepal" section (`AIRecommendations.tsx`). Ranks the catalog by booking popularity + category affinity for logged-in users, then asks Gemini to pick the top N with a one-line reason. Falls back to popularity ranking if Gemini is offline.
- **Travel chatbot** — floating widget on every page (`ChatWidget.tsx`). Multi-turn chat grounded in the live package catalog. Replies can include `[SUGGEST: slug1, slug2]` tags that render as inline "View package" chips deep-linking to `/destinations?slug=…`.
- **AI itinerary generator** — `POST /api/ai/itinerary/:slug` produces a day-by-day plan tailored to `{ days, adults, children }`. Cached per `<days>d-<bucket>` key on the Package document (`aiItineraryCache[]`, capped at 20 entries).
- **Best-season note** — `GET /api/ai/best-season/:slug` returns a short weather/timing tip per package; persisted on the Package (`aiBestSeasonNote`).
- **Semantic search** — `POST /api/ai/search` re-ranks keyword candidates with Gemini and returns a 0-100 relevance score + reason per result.
- **Similar packages** — `GET /api/ai/similar/:slug` returns 3 related trips using a deterministic score (category + price bucket + popularity + offer boost) — no AI call needed.
- **Resilience** — every AI endpoint checks `GEMINI_API_KEY`, retries primary → fallback model on quota errors, and ships a non-AI fallback response so the UI never breaks when AI is offline.

### Maintenance mode
- Admin toggle blocks the public site. Enforced both in `MaintenanceGate` (frontend) and `maintenanceCheck` middleware (backend, returns `503`). `/admin/*` and `/login` remain reachable for recovery.

### Security & performance
- helmet, per-endpoint rate limits, 50 KB body limit, `trust proxy 1`, env validation at boot.
- Regex-escaped admin search (ReDoS-safe), bcrypt cost 12, schema-level `toJSON` strips secrets, every model uses `strict: true`.
- ISR on `/` and `/destinations`, `Cache-Control` headers on `/api/packages`, lazy-loaded dialogs via `next/dynamic`, `loading.tsx` + `error.tsx` boundaries.
- Targeted DB indexes on `Booking`, `Package`, `User`, `ContactMessage`.

---

## Repository layout

```
tours and travel/
├── ARCHITECTURE.md         decision log + system design
├── CLAUDE.md               practical "how to do X" guide
├── backend/                Express API (CommonJS)
│   └── src/
│       ├── server.js       boot + .env validation
│       ├── app.js          helmet · cors · maintenance gate · routes · errorHandler
│       ├── controllers/    auth · admin · packages · bookings · contact · settings · ai · …
│       ├── models/         User · Package · Booking · ContactMessage · Settings · …
│       ├── middleware/     auth · rateLimits (incl. aiLimiter + aiChatLimiter) · maintenanceCheck · errorHandler
│       ├── routes/         per-resource routers (incl. ai.routes.js)
│       ├── services/ai/    gemini.client.js · popularity.service.js · prompts.js
│       ├── scripts/        seedPackages.js (idempotent — 20 regular + 10 offers)
│       └── utils/          tokens · mailer · validators · slugify
└── frontend/               Next.js 16 SPA (App Router, TS)
    └── src/
        ├── app/            routes (public · auth-gated · admin-gated); ChatWidget mounted in root layout
        ├── components/     layout · home · forms · auth · profile · admin · packages · booking · ai · ui
        ├── lib/api/        axios client + service files (only place axios is imported, incl. ai.service.ts)
        ├── lib/validators/ zod schemas (incl. ai.schema.ts)
        ├── store/          auth.store.ts (no persist)
        └── types/          shared TS contracts (incl. AI types: ChatMessage, AIRecommendation, Itinerary, …)
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for folder-boundary rules and import constraints.

---

## Getting started

### Prerequisites
- Node.js 20+
- MongoDB Atlas cluster (or local MongoDB)
- A Gmail account with **2FA enabled** + an **App Password** ([generate here](https://myaccount.google.com/apppasswords))

### 1. Clone and install

```bash
git clone <repo-url>
cd "tours and travel"

cd backend  && npm install
cd ../frontend && npm install
```

### 2. Configure environment

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

# Google Gemini — leave blank to run AI endpoints in offline fallback mode
GEMINI_API_KEY=<your AI Studio key>

# eSewa — required for advance-booking online payment
ESEWA_MERCHANT_CODE=<merchant code>
ESEWA_SECRET_KEY=<HMAC secret>
ESEWA_PAYMENT_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_STATUS_URL=https://rc.esewa.com.np/api/epay/transaction/status/
ESEWA_SUCCESS_URL=http://localhost:3000/booking/esewa/success
ESEWA_FAILURE_URL=http://localhost:3000/booking/esewa/failure
```

The first four are validated at startup — the process exits if any are missing.

**`frontend/.env.local`** (copy from `.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Pokhara Tours and Travel
```

### 3. Seed the database (optional)

```bash
cd backend
node src/scripts/seedPackages.js   # 20 regular + 10 offer Nepal packages, idempotent
```

### 4. Run dev servers (in two terminals)

```bash
cd backend && npm run dev          # http://localhost:5000
cd frontend && npm run dev         # http://localhost:3000
```

### 5. Promote your account to admin

After registering and verifying your email, run this in the Mongo shell or Atlas data-explorer:

```js
db.users.updateOne({ email: 'you@example.com' }, { $set: { role: 'admin' } })
```

Log out and back in (or wait for `/refresh`) and `/admin/*` is yours.

---

## Available commands

### Backend (`cd backend`)
| Command | Purpose |
|---|---|
| `npm run dev` | nodemon, watches `src/` |
| `npm start` | production |
| `node src/scripts/seedPackages.js` | seed 30 packages |

### Frontend (`cd frontend`)
| Command | Purpose |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | production build |
| `npm start` | run built app |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | type-check (run before declaring a task done) |

---

## Auth model at a glance

| Token | TTL | Storage | Sent how |
|---|---|---|---|
| Access JWT | 15 min | Zustand state — **never on disk** | `Authorization: Bearer <token>` |
| Refresh JWT | 7 days | `HttpOnly + Secure(prod) + SameSite=Lax` cookie, path `/api/auth` | Browser auto-attaches |
| Refresh hash | persistent | bcrypt-hashed on the matching row in `User.sessions[]` (one row per device, cost 12) | Never sent — server-side only |

- **Session-bound tokens** — both JWTs carry an `sid` claim that points at a row in `User.sessions[]`. **Every protected request** re-validates `sid` against the session table, so logout, password reset, "sign out everywhere", and per-device revoke kill the still-unexpired access token on its next use.
- **Cold reload** — `<AuthHydrator />` calls `/api/auth/refresh`; if the refresh cookie is valid, the store is repopulated.
- **Logout** — clears the in-memory store optimistically, then revokes the refresh cookie + that session's DB hash.
- **Refresh-token rotation** — every `/refresh` invalidates the old hash on that session only. Reused/mismatched hash wipes that one session (not all of them).

Full flow in [`ARCHITECTURE.md` §11](./ARCHITECTURE.md). For the portable pattern (data model, code skeletons, how to port to other stacks), see [`authhandling.md`](./authhandling.md).

---

## API surface (summary)

Base URL: `process.env.NEXT_PUBLIC_API_URL` → `http://localhost:5000` in dev.

- **Auth** — `POST /api/auth/{register,login,login/2fa,refresh,logout,resend-verification,change-password/request,change-password/confirm,forgot-password,reset-password,2fa/setup,2fa/enable,2fa/disable}` · `GET /api/auth/{verify-email,me,sessions}` · `PATCH /api/auth/me` · `DELETE /api/auth/sessions{,/:id}`
- **Public** — `GET /api/{packages,packages/:slug,settings,health}` · `POST /api/{contact,newsletter}`
- **Bookings (auth)** — `POST /api/bookings` · `GET /api/bookings/me{,/:id}` · `PATCH /api/bookings/me/:id/cancel` · `POST /api/bookings/:id/esewa-init` · `POST /api/bookings/esewa-verify` (eSewa signature is the auth)
- **AI (`authOptional`, rate-limited)** — `POST /api/ai/recommendations` · `POST /api/ai/chat` · `POST /api/ai/itinerary/:slug` · `GET /api/ai/best-season/:slug` · `POST /api/ai/search` · `GET /api/ai/similar/:slug`
- **Admin (`authRequired + adminOnly`)** — `/api/admin/{users,packages,bookings,messages,analytics/overview,settings}`

Response envelope:

```ts
type ApiSuccess<T> = { data: T; message?: string };
type ApiError     = { error: string; code?: string };  // code stripped in production
```

Full contracts in [`ARCHITECTURE.md` §6](./ARCHITECTURE.md).

---

## Conventions & guardrails

- **No axios outside `frontend/src/lib/api/`.** Components and pages call services or stores.
- **No global state outside `frontend/src/store/`.** Zustand stores are flat and never import each other.
- **No business logic in `frontend/src/app/*`.** Pages compose components and call stores.
- **No `<img>`.** `next/image` everywhere; `unoptimized` for arbitrary admin URLs.
- **No `any` in TypeScript.** Use `unknown` and narrow.
- **No `$regex` from raw `req.query`.** Run input through `escapeRegex()` and clamp length.
- **No comments restating what code does.** WHY-only, when non-obvious.
- **Tailwind v4** has no `tailwind.config.ts`; theme tokens live in `globals.css` under `@theme inline`.
- **Tokens never hit `localStorage`** in any form.

See [`CLAUDE.md` §7](./CLAUDE.md) for the full "where logic does NOT go" list.

---

## Caveats

- **Inner git repo trap** — `create-next-app` initialises `frontend/.git`. If you re-bootstrap the frontend, **delete `frontend/.git` immediately**, or GitHub will see only an empty submodule pointer.
- **Lucide brand glyphs are removed** (Facebook, Twitter, Instagram, etc.). Use `frontend/src/components/layout/SocialIcons.tsx` (inline SVGs).
- **Admin-supplied gallery URLs** must be rendered with `<Image … unoptimized>` — Next throws otherwise.
- **Password-change OTP is single-shot** by design. A wrong code invalidates the OTP — request a new one.
- **ISR lag** — package edits via `/admin/packages` won't appear on `/destinations` until the 5 min revalidation expires. Call `revalidatePath('/destinations')` if instant freshness is needed.
- **Gmail SMTP requires an App Password**, not your normal Google login (2FA must be enabled first).
- **AI runs in graceful-degradation mode** — if `GEMINI_API_KEY` is missing or Gemini is rate-limited/unreachable, every `/api/ai/*` endpoint returns a sensible non-AI response (popularity-based recommendations, canned chat reply, keyword search, fallback itinerary). The UI silently uses these.
- **AI itinerary cache is per-package, not per-user** — same `{days, adults, children}` input reuses the cached plan, so two users asking for the same shape get the same itinerary. Cap is 20 entries per package (FIFO).

More in [`CLAUDE.md` §13](./CLAUDE.md).

---

## Out of scope (deferred)

- Khalti / Stripe / international card gateways — **eSewa is wired** for `advance` bookings; cash on arrival is still admin-marked.
- Date *range* (start + end) — single date only.
- i18n (English / Nepali) — `next-intl` planned later.
- Image upload pipeline / Cloudinary — online URLs only.

---

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — practical guide: commands, folder map, naming, "how to add X" recipes, definition of done.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design, decision log, API contracts, type contracts, security/performance strategy, change log.
- [`authhandling.md`](./authhandling.md) — reusable session-bound JWT pattern with multi-device sessions; pattern-first write-up with portable code skeletons and a "translating to other stacks" appendix.
