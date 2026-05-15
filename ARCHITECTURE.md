# Pokhara Tours and Travel — Architecture

> **Status:** Living document. Update this file *before* changing structure or conventions.
> **Audience:** Anyone (human or AI) about to write code in this repo.
> **Pair with:** [`CLAUDE.md`](./CLAUDE.md) — the practical "how to do X" guide.

---

## 1. System Overview

A MERN-stack marketing + booking website for **Pokhara Tours and Travel**, a Nepal-focused tours company. The repo is a **monorepo** with two top-level apps: `backend/` (API) and `frontend/` (SPA), deployed independently.

| Layer        | Technology                                                                                                  | Status |
|--------------|-------------------------------------------------------------------------------------------------------------|--------|
| Frontend     | Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · Zustand 5 · framer-motion 12             | Built  |
| Backend      | Node.js · Express 5 · MongoDB Atlas · Mongoose 9 · jsonwebtoken 9 · bcryptjs 3                                | Built  |
| Security     | helmet · express-rate-limit · compression · morgan                                                            | Built  |
| Mail         | Nodemailer 8 + Gmail SMTP (App Password)                                                                     | Built  |
| AI           | Google Gemini via `@google/generative-ai` (`gemini-2.5-flash` primary + `gemini-flash-lite-latest` fallback) | Built  |
| Hosting      | Vercel (frontend) · Render/Railway (backend) · MongoDB Atlas                                                  | Future |
| Image hosts  | Unsplash, Pexels, Picsum (allowlisted) + arbitrary admin URLs (rendered `unoptimized`)                       | Built  |

**What's live now:**

- **Public site** — Home (RSC-fetched newest 3 packages, offer-prioritized) · About · Destinations (search + category + sort + pagination, ISR every 5 min) · Contact (logged-in or anonymous) · Privacy · Terms · branded 404.
- **Auth** — register → email verify (TTL 24 h, configurable) → login → silent refresh → logout. **Password change** uses a 6-digit email OTP from `/profile` (single-shot, 10 min). **Forgot-password** (unauthenticated) sends a signed reset link valid for 60 min, single-shot, and wipes all sessions on success — see §18. **TOTP-based 2FA** (RFC 6238) is optional per-user; a successful credentials check returns a short-lived 2FA challenge token, then `/api/auth/login/2fa` exchanges code + challenge for the real session.
- **Multi-device sessions** — refresh tokens are bound to a per-device session row (`User.sessions[]`) with `deviceLabel`, `ip`, `userAgent`, `lastUsedAt`. Users can list / revoke individual sessions or "sign out everywhere else" from `/profile`. Capped at 10 sessions per user (oldest pruned).
- **Profile** — account info · edit name · change password (OTP-confirmed) · 2FA enable / disable · active-sessions list (revoke individually or all others) · my bookings (with self-service cancel) · my messages (with admin replies thread).
- **Booking** — end-to-end flow with date picker, traveler stepper, contact, payment-method radio, server-recomputed total, snapshot persistence. **Self-service cancel** from `/profile → My bookings` when start date is ≥ 24 h away; refund window mirrors the published terms.
- **Online payment (eSewa)** — `advance` bookings can be paid via eSewa: signed init payload → redirect → signed verify callback → server status check → `paymentStatus: 'paid'`. Status pulled from `/api/bookings/me/:id` after the redirect; admin can still mark cash/`on_arrival` bookings paid manually.
- **Admin panel** — Dashboard (live counts, 30-day revenue, 5 most-recent bookings, 30 s in-memory cache) · Users (search + role toggle + delete) · Packages (CRUD with category + offer toggle) · Bookings (search + filters + mark paid / confirm / cancel / delete) · Messages (search + filters + reply via email) · Settings (maintenance mode toggle).
- **Offers + categories** — every Package has `isOffer: boolean` and `category` enum (`trek/tour/adventure/cultural/wildlife`). Destinations page splits offers into a top section.
- **Maintenance mode** — admin toggle in `/admin/settings` blocks the public site (server-side middleware + frontend gate); `/admin/*` and `/login` stay reachable for recovery.
- **AI features (Google Gemini)** — home-page AI recommendations (popularity + category affinity + Gemini rerank), site-wide floating chatbot grounded in the live catalog, on-demand itinerary generator (cached per package + traveller shape), best-season note (cached per package), semantic search re-ranker, and deterministic "similar packages" scorer. Every endpoint gracefully degrades to a non-AI fallback when `GEMINI_API_KEY` is missing or Gemini is unreachable/quota-limited. See §23.
- **Performance** — ISR on `/destinations` and `/`, `Cache-Control` headers on `/api/packages`, lazy-loaded dialogs (`next/dynamic`), `loading.tsx` + `error.tsx` boundaries on `/admin` and `/destinations`, framer-motion entry animations + inset hover shadow on cards.
- **Security** — helmet headers, per-endpoint rate limiting, server-side maintenance enforcement, regex-escaped admin search (ReDoS), bcrypt cost 12, 50 KB body limit, `trust proxy 1`, schema-level `toJSON` strips secrets from `User`, `strict: true` on every schema, `.env` validated at boot, error codes hidden in production.

---

## 2. Why each choice (decision log)

| Choice                                  | Reason                                                                                                |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------|
| **Monorepo (`backend/` + `frontend/`)** | Independent deploys; clear domain split; one git repo for context.                                    |
| **Next.js 16 App Router**               | Server components by default → smaller JS, better SEO; layouts replace shared chrome cleanly.         |
| **TypeScript** (frontend)               | Catches contract drift between client and API.                                                        |
| **JavaScript** (backend)                | Keeps Express setup simple; no transpile step.                                                        |
| **Tailwind CSS 4**                      | Theme tokens live in CSS via `@theme inline` — no `tailwind.config.ts` needed.                        |
| **Zustand 5** (no `persist`)            | Tiny global store. No persistence — auth state must not survive a tab close.                          |
| **In-memory access + httpOnly refresh** | Strongest practical SPA auth pattern (Auth0 / Okta style). See §11.                                   |
| **Email verification before login**     | Prevents fake signups from logging in; unverified records auto-cleaned via TTL index.                 |
| **OTP-confirmed password change**       | A leaked access token alone can't change the password — attacker also needs inbox access. Single-shot OTP prevents brute force. See §17. |
| **Forgot-password = signed link, not OTP** | The unauthenticated reset uses a 32-byte hex token in a one-time URL (mirroring email verification) instead of a 6-digit OTP. URL tokens have ~256 bits of entropy vs ~20 bits for a 6-digit code, so a longer 60 min window is still safe. Always returns 200 to hide which emails are registered. See §18. |
| **Reset success wipes all sessions**    | A user resetting their password almost certainly believes the old password was compromised. Clearing `User.sessions[]` invalidates every existing refresh token, so any attacker holding one is kicked out immediately. |
| **react-hook-form + zod**               | Uncontrolled inputs (fast); zod schemas validate on the client and document the server contract.      |
| **framer-motion 12** + CSS keyframes    | Card entry stagger + inset hover shadows; replaces WOW.js / jQuery effects.                           |
| **lucide-react 1.14**                   | Tree-shakable icons. Brand glyphs (Facebook/Twitter/etc.) are removed — see `components/layout/SocialIcons.tsx`. |
| **MongoDB Atlas**                       | Managed cluster — no local DB to run; same in dev and prod.                                           |
| **Online image URLs only**              | No upload pipeline. Static curated content uses Unsplash / Pexels (host-allowlisted); admin-supplied package gallery URLs render with `unoptimized` so any host works. Seed script uses `picsum.photos` — bulletproof, no domain config needed. |
| **Booking model: snapshot + total**     | `packageSnapshot` denormalises title/price/cover at booking time; server-side total prevents tampering. |
| **Native `<input type="date">`**        | Zero deps; `min={today}` enforces future dates.                                                       |
| **Singleton Settings document**         | One row keyed by `key: 'global'` is simpler than a config service. `Settings.getSingleton()` upserts on first read. See §15. |
| **ISR for packages, client filters**    | Packages change a few times a week — `revalidate: 300` server-renders the cards once and lets the browser handle search / sort / pagination instantly. See §16. |
| **Server-side maintenance gate**        | Frontend block alone is bypassable via curl. A middleware checks `Settings.maintenanceMode` on every non-exempt request and returns `503` to non-admins. See §15. |
| **Per-endpoint rate limits**            | `express-rate-limit` per route (login 10/15 min, contact 5/h, etc.) closes brute-force + spam without a heavy gateway. |
| **In-memory dashboard cache**           | 7-query dashboard fetch becomes 1 hash lookup for 30 s, busted by booking writes. Acceptable freshness for an admin view. |
| **`force-static` on legal/static pages**| Locks `/about`, `/contact`, `/privacy`, `/terms`, `/not-found` as fully static so a future code change can't accidentally make them dynamic. |
| **bcrypt cost 12**                      | OWASP 2026 guidance for password hashing. ~150 ms per login (acceptable; login is rate-limited).      |
| **Google Gemini for AI**                | Free-tier-friendly, fast JSON-mode generation, system-instruction support. Primary `gemini-2.5-flash` with `gemini-flash-lite-latest` as a quota-error fallback. See §23. |
| **AI as enhancement, never required**   | Every AI endpoint ships a deterministic fallback (popularity ranking, keyword search, canned chat reply, generic itinerary stub) so the product works even if `GEMINI_API_KEY` is missing or Gemini is down. |
| **AI results cached on the Package doc**| `aiBestSeasonNote` (single string) and `aiItineraryCache[]` (keyed by `<days>d-<adults>a[-<children>c]`, FIFO cap 20) avoid paying Gemini twice for the same prompt and survive process restarts. |
| **Popularity-driven recommendations**   | 5-minute in-memory cache of bookings-derived popularity + category affinity. Lets the AI start from real signal instead of cold-starting from titles alone. |
| **Chat suggestion tag (`[SUGGEST: …]`)**| Lightweight, parseable contract for inline deep-links. Avoids forcing the model into strict JSON for every chat turn while still letting us render clickable package chips. |
| **TOTP 2FA (not SMS/email)**            | RFC 6238 with a Google-Authenticator-compatible secret. No SMS gateway dependency, no SIM-swap risk, no extra mailer round-trip per login. Pairs cleanly with the existing in-memory access / httpOnly refresh model. |
| **Per-session refresh tokens**          | Each device gets its own session row + refresh hash. Lets users revoke individual devices without nuking everyone, and makes "sign out everywhere" a single DB write. Capped at 10 sessions/user (FIFO prune). |
| **eSewa as the first online gateway**   | Local NPR-native gateway, free dev sandbox, hash-signed payloads on both legs. Khalti / Stripe deferred until demand is real. |
| **Self-service cancel with 24 h lead-time** | Cuts admin workload for routine "I can't make it" cancels while still giving operations a buffer to reroute resources. Cancelling within 24 h still requires admin (and triggers refund-policy conversation). |

---

## 3. Top-level repo layout

```
tours and travel/
├── ARCHITECTURE.md
├── CLAUDE.md
├── backend/                                ← Express API (CommonJS, JS)
│   ├── src/
│   │   ├── server.js                       Boot — validates required .env at startup
│   │   ├── app.js                          helmet · compression · morgan · CORS · trust proxy 1 · 50 kb body
│   │   │                                   · cookieParser · health · maintenance gate · routes · errorHandler
│   │   ├── config/db.js                    mongoose.connect(MONGO_URI)
│   │   ├── controllers/
│   │   │   ├── auth.controller.js          register/login/verify/refresh/logout/me/updateMe
│   │   │   │                               + requestPasswordChange + confirmPasswordChange (OTP)
│   │   │   │                               + forgotPassword + resetPassword (signed reset link)
│   │   │   │                               + 2FA (setup/enable/disable) + sessions (list/revoke)
│   │   │   ├── admin.controller.js         users + packages + bookings + messages + analytics + settings
│   │   │   ├── ai.controller.js            recommendations + chat + itinerary + bestSeason + semanticSearch + similar
│   │   │   ├── packages.controller.js      public list + getBySlug (with Cache-Control headers)
│   │   │   ├── bookings.controller.js      create (auth) / listMine / getMine
│   │   │   ├── contact.controller.js       submit (authOptional) / listMine
│   │   │   ├── settings.controller.js      public GET (maintenance status only)
│   │   │   ├── newsletter.controller.js
│   │   │   └── destinations.controller.js  legacy stub
│   │   ├── models/   (all schemas use `strict: true`)
│   │   │   ├── User.js                     role/email-verify/refreshTokenHash/passwordChangeOtp
│   │   │   │                               + passwordResetTokenHash/passwordResetTokenExpires
│   │   │   │                               · toPublic() · schema-level toJSON strips all secrets
│   │   │   ├── Package.js                  slug/title/description/priceNPR/gallery/isOffer/category
│   │   │   │                               + aiBestSeasonNote + aiItineraryCache[{key,content,generatedAt}]
│   │   │   │                               · indexes: isOffer+createdAt, category+createdAt
│   │   │   ├── Booking.js                  user/packageSlug/startDate/travelers/contact
│   │   │   │                               /paymentMethod/paymentStatus/totalNPR/packageSnapshot/status
│   │   │   │                               · indexes: createdAt, user+createdAt
│   │   │   ├── ContactMessage.js           name/email/subject/message + status + replies[] + user (optional)
│   │   │   ├── Settings.js                 singleton (key='global'); maintenanceMode + maintenanceMessage
│   │   │   ├── Destination.js              scaffolded but unused
│   │   │   └── NewsletterSubscriber.js
│   │   ├── middleware/
│   │   │   ├── auth.js                     authRequired · authOptional · adminOnly
│   │   │   ├── rateLimits.js               per-endpoint limiters
│   │   │   ├── maintenanceCheck.js         server-side enforcement of maintenance mode
│   │   │   ├── errorHandler.js             status + message; hides err.code in production
│   │   │   └── notFound.js
│   │   ├── routes/                         auth · admin · ai · packages · bookings · contact · newsletter
│   │   │                                   · settings · destinations
│   │   ├── services/
│   │   │   └── ai/
│   │   │       ├── gemini.client.js        thin SDK wrapper (isEnabled · generateText · generateJSON
│   │   │       │                            · generateChat) with primary→fallback model retry on quota
│   │   │       ├── popularity.service.js   bookings-derived popularity + category affinity
│   │   │       │                            + user booked slugs + seasonal distribution (5 min cache)
│   │   │       └── prompts.js              recommendationPrompt · chatSystemPrompt · packageCatalog
│   │   │                                   · itineraryPrompt · bestSeasonPrompt · semanticSearchPrompt
│   │   ├── scripts/
│   │   │   └── seedPackages.js             Idempotent upsert: 20 regular + 10 offer Nepal packages
│   │   └── utils/                          tokens.js (sign/verify, refreshCookieOptions)
│   │                                       · mailer.js (verify + contact reply + password OTP)
│   │                                       · validators.js (email/phone/username + escapeRegex)
│   │                                       · slugify.js
│   ├── .env / .env.example
│   └── package.json
└── frontend/                               ← Next.js 16 SPA (App Router, TS)
    ├── next.config.ts                      images.remotePatterns (Unsplash, Pexels, Picsum)
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx                  <AuthHydrator /> + <MaintenanceGate>{<Navbar/> + main + <Footer/>}</MaintenanceGate>
    │   │   ├── page.tsx                    Home (async RSC; fetches featured packages)
    │   │   ├── icon.svg                    Branded favicon (Next picks it up automatically)
    │   │   ├── opengraph-image.tsx         Programmatic 1200×630 OG (next/og)
    │   │   ├── not-found.tsx               Branded 404 (force-static)
    │   │   ├── about/page.tsx              force-static
    │   │   ├── contact/                    page.tsx (force-static) + ContactForm.tsx (auth-aware prefill)
    │   │   ├── privacy/page.tsx            force-static
    │   │   ├── terms/page.tsx              force-static
    │   │   ├── destinations/
    │   │   │   ├── page.tsx                async RSC; fetches packages with revalidate: 300; passes initialPackages
    │   │   │   ├── DestinationsClient.tsx  search + category + sort + paged sections (offers / regular)
    │   │   │   └── loading.tsx             skeleton card grid
    │   │   ├── login/page.tsx              Suspense
    │   │   ├── register/page.tsx           Suspense
    │   │   ├── verify-email/               Suspense + VerifyEmailClient.tsx
    │   │   ├── profile/                    layout (auth) + page + ProfileClient
    │   │   ├── booking/                    layout (auth) + page + BookingClient
    │   │   └── admin/                      layout (admin) + page (redirect) + loading.tsx + error.tsx
    │   │       ├── dashboard/page.tsx + DashboardClient.tsx     (live stats + recent bookings)
    │   │       ├── users/page.tsx + UsersClient.tsx
    │   │       ├── packages/page.tsx + PackagesClient.tsx       (lazy PackageFormDialog)
    │   │       ├── bookings/page.tsx + BookingsClient.tsx
    │   │       ├── messages/page.tsx + MessagesClient.tsx
    │   │       │   + MessageDetailDialog.tsx  (lazy)
    │   │       ├── settings/page.tsx + SettingsClient.tsx        (maintenance toggle)
    │   │       └── about/page.tsx                                placeholder
    │   ├── components/
    │   │   ├── layout/                     Navbar, Footer, Logo, SocialIcons
    │   │   ├── home/                       Hero, About, Services, Destinations (lazy detail dialog), ContactCTA
    │   │   ├── forms/                      LoginForm, RegisterForm
    │   │   ├── auth/                       AuthHydrator, ProtectedRoute, MaintenanceGate
    │   │   ├── profile/                    EditProfileForm, ChangePasswordForm (OTP), MyBookings, MyMessages
    │   │   ├── admin/                      AdminSidebar, PageHeader, Placeholder, PackageFormDialog
    │   │   ├── ai/                         AIRecommendations (home section) · ChatWidget (global floating)
    │   │   ├── packages/                   PackageDetailDialog (image slider + Book CTA)
    │   │   ├── booking/                    DateField, TravelerCounter, PaymentMethodSelect, BookingSummary
    │   │   └── ui/                         Pagination
    │   ├── lib/
    │   │   ├── api/                        client.ts (axios + interceptors) + service files
    │   │   │                               (auth · admin · packages · bookings · contact · settings · ai)
    │   │   ├── validators/                 auth · package · booking · contact · ai (zod)
    │   │   ├── hooks/                      useDebounce
    │   │   └── utils.ts                    cn() · formatNPR()
    │   ├── store/                          auth.store.ts (no persist)
    │   └── types/                          User · Package · Booking · ContactMessage · Settings
    │                                       · DashboardStats · Paginated · ApiResponse
    │                                       · ChatMessage · AIRecommendation · Itinerary · …
    ├── .env.local / .env.example
    └── package.json
```

---

## 4. Folder boundaries

### Backend
- `controllers/` — request → response. Validate input, call models + utils, return JSON. No HTTP/Express details leak elsewhere.
- `models/` — Mongoose schemas + instance methods (`setPassword`, `verifyPassword`, `toPublic`/`toJSON` transforms). All schemas use `strict: true`.
- `middleware/` — pure middleware fns. `authRequired` reads only `Authorization: Bearer …`. `authOptional` decodes the token if present but doesn't fail. `adminOnly` checks `req.user.role === 'admin'`. `maintenanceCheck` blocks non-admin, non-exempt requests when `Settings.maintenanceMode === true`. `rateLimits` exposes per-endpoint limiters.
- `utils/` — `tokens.js`, `mailer.js`, `validators.js` (now exports `escapeRegex`), `slugify.js`.
- `routes/` — only wire HTTP verbs to controller fns. Apply middleware. No business logic.
- `scripts/` — one-off ops (currently `seedPackages.js`). Loaded with `node src/scripts/<name>.js` from `backend/`.

### Frontend
- `app/` — Next routes only. Compose components and call store actions. **No business logic.**
- `components/` — presentational + container components. **Never** import from `lib/api/*` directly; use a store action or accept props.
- `store/` — Zustand stores. One concern per file. Stores never import other stores.
- `lib/api/` — the **only** place axios is imported. Each `*.service.ts` exports typed async fns and unwraps `{ data }` envelopes.
- `lib/validators/` — zod schemas, one per form/feature.
- `lib/hooks/` — reusable React hooks (e.g. `useDebounce`).
- `types/` — shared TS types (User, Package, Booking, ContactMessage, Settings, …).

**Forbidden imports (enforced at review):**
- `components/*` → `lib/api/*` ❌  (use a store action instead)
- `store/*` → `components/*` ❌
- `app/*` → axios directly ❌  (always go through a service)

---

## 5. Routing map (frontend)

| URL                          | File                                          | Rendering          | Status |
|------------------------------|-----------------------------------------------|--------------------|--------|
| `/`                          | `app/page.tsx` (async RSC)                    | ISR (revalidate 300) | ✅   |
| `/about`                     | `app/about/page.tsx`                          | `force-static`     | ✅     |
| `/destinations`              | `app/destinations/page.tsx` + Client          | ISR (revalidate 300) | ✅   |
| `/contact`                   | `app/contact/page.tsx` + ContactForm          | `force-static`     | ✅     |
| `/privacy`                   | `app/privacy/page.tsx`                        | `force-static`     | ✅     |
| `/terms`                     | `app/terms/page.tsx`                          | `force-static`     | ✅     |
| `/login`                     | `app/login/page.tsx`                          | static             | ✅     |
| `/register`                  | `app/register/page.tsx`                       | static             | ✅     |
| `/verify-email`              | `app/verify-email/page.tsx`                   | dynamic SSR        | ✅     |
| `/forgot-password`           | `app/forgot-password/page.tsx` + ForgotPasswordForm | static       | ✅     |
| `/reset-password`            | `app/reset-password/page.tsx` + ResetPasswordClient | dynamic SSR  | ✅     |
| `/profile`                   | `app/profile/page.tsx` (auth-gated)           | dynamic SSR        | ✅     |
| `/booking?package=<slug>`    | `app/booking/page.tsx` (auth-gated)           | dynamic SSR        | ✅     |
| `/admin/dashboard`           | `app/admin/dashboard/page.tsx`                | dynamic SSR        | ✅     |
| `/admin/users`               | `app/admin/users/page.tsx`                    | dynamic SSR        | ✅     |
| `/admin/packages`            | `app/admin/packages/page.tsx`                 | dynamic SSR        | ✅     |
| `/admin/bookings`            | `app/admin/bookings/page.tsx`                 | dynamic SSR        | ✅     |
| `/admin/messages`            | `app/admin/messages/page.tsx`                 | dynamic SSR        | ✅     |
| `/admin/settings`            | `app/admin/settings/page.tsx`                 | dynamic SSR        | ✅     |
| `/admin/about`               | `app/admin/about/page.tsx`                    | placeholder        | placeholder |
| 404 (any unmatched)          | `app/not-found.tsx`                           | `force-static`     | ✅     |

**Replaced / removed:** the old `/admin/offers` placeholder is gone; offers are now a `isOffer` flag on Package and surfaced in the Destinations page. Original `/destinations/[slug]` plan was superseded by `<PackageDetailDialog>` (image slider + description popup) opened from the cards.

**Auth-gating:** `<ProtectedRoute>` wraps the layouts of `profile`, `booking`, `admin`. `requireRole="admin"` on the admin layout; not-admin users redirect to `/profile`.

**Maintenance-gating:** `<MaintenanceGate>` (in `components/auth/`) wraps the entire chrome (Navbar + main + Footer). When `maintenanceMode === true` and the user is not an admin, the gate replaces the page with a maintenance screen — except on `/admin/*` and `/login`, which always pass through. Polls `/api/settings` every 60 s.

**Shared chrome** in `app/layout.tsx`:
```tsx
<AuthHydrator />
<MaintenanceGate>
  <Navbar />
  <main>{children}</main>
  <Footer />
</MaintenanceGate>
<ChatWidget />   {/* floating AI travel assistant — visible on every page */}
```

---

## 6. API contracts

Base URL: `process.env.NEXT_PUBLIC_API_URL` (frontend) → `http://localhost:5000` in dev.

### Auth (`/api/auth`)

| Method | Path                                  | Auth          | Body / Query                                  | Response                                                            |
|--------|---------------------------------------|---------------|-----------------------------------------------|---------------------------------------------------------------------|
| POST   | `/api/auth/register`                  | none          | `{ name, username, email, phone, password }`  | `201 { user, requiresEmailVerification, message }` (no tokens)       |
| POST   | `/api/auth/login`                     | none          | `{ email, password }`                         | `200 { user, accessToken }` + `Set-Cookie: refreshToken`            |
| GET    | `/api/auth/verify-email`              | none          | `?token=&id=`                                 | `200 { user, accessToken, verified }` + cookie                       |
| POST   | `/api/auth/resend-verification`       | none          | `{ email }`                                   | `200 { ok: true }`                                                  |
| POST   | `/api/auth/refresh`                   | refresh cookie| —                                             | `200 { user, accessToken }` + new cookie                            |
| POST   | `/api/auth/logout`                    | refresh cookie| —                                             | `200 { ok: true }` + clears cookie + DB hash                        |
| GET    | `/api/auth/me`                        | Bearer        | —                                             | `200 { user }`                                                      |
| PATCH  | `/api/auth/me`                        | Bearer        | `{ name }`                                    | `200 { user }`                                                      |
| POST   | `/api/auth/change-password/request`   | Bearer        | `{ currentPassword }`                         | `200 { ok, ttlMinutes, emailHint }` — sends 6-digit OTP             |
| POST   | `/api/auth/change-password/confirm`   | Bearer        | `{ otp, newPassword }`                        | `200 { ok, user }` — single-shot OTP, sets new password              |
| POST   | `/api/auth/forgot-password`           | none          | `{ email }`                                   | `200 { ok: true }` (always) — emails a reset link only to verified accounts |
| POST   | `/api/auth/reset-password`            | none          | `{ token, id, newPassword }`                  | `200 { ok: true }` — single-shot 60 min token; success clears `User.sessions[]` (logs out every device). Returns `400 code:'RESET_EXPIRED'` when expired. |

All limiter-bearing endpoints: `login` 10/15 min, `register` 5/h, `resend-verification` 3/h, `change-password/*` 5/h, `forgot-password` + `reset-password` 5/h (shared `passwordResetLimiter`).

### Admin (`/api/admin`) — all routes require `authRequired + adminOnly`

| Method | Path                                  | Body / Query                                              | Notes                                                |
|--------|---------------------------------------|-----------------------------------------------------------|------------------------------------------------------|
| GET    | `/api/admin/users`                    | `?q=&page=&limit=`                                        | Paginated; q is regex-escaped + 100-char clamped     |
| PATCH  | `/api/admin/users/:id`                | `{ role: 'user' \| 'admin' }`                             | Self-demote refused                                  |
| DELETE | `/api/admin/users/:id`                | —                                                         | Self-delete refused                                  |
| GET    | `/api/admin/packages`                 | —                                                         | Same shape as public list                            |
| POST   | `/api/admin/packages`                 | `{ title, description, priceNPR, gallery[], isOffer, category }` | Slug auto-generated                            |
| PATCH  | `/api/admin/packages/:id`             | `{ …same…, regenerateSlug? }`                             |                                                      |
| DELETE | `/api/admin/packages/:id`             | —                                                         |                                                      |
| GET    | `/api/admin/bookings`                 | `?q=&page=&limit=&status=&paymentStatus=`                 | Populates user; sorted newest first                  |
| GET    | `/api/admin/bookings/:id`             | —                                                         | Populated                                            |
| PATCH  | `/api/admin/bookings/:id/status`      | `{ status: pending\|confirmed\|cancelled }`               | Busts dashboard cache                                |
| PATCH  | `/api/admin/bookings/:id/payment`     | `{ paymentStatus: advance_pending\|awaiting_arrival\|paid }` | Busts dashboard cache                            |
| DELETE | `/api/admin/bookings/:id`             | —                                                         | Busts dashboard cache                                |
| GET    | `/api/admin/messages`                 | `?q=&page=&limit=&status=`                                | Returns `{ items, total, unread, page, limit }`      |
| GET    | `/api/admin/messages/:id`             | —                                                         |                                                      |
| PATCH  | `/api/admin/messages/:id/read`        | —                                                         | Flips `new` → `read`                                 |
| POST   | `/api/admin/messages/:id/reply`       | `{ body }` (≤ 5000 chars)                                 | Sends email + appends to `replies[]` + status `replied` |
| DELETE | `/api/admin/messages/:id`             | —                                                         |                                                      |
| GET    | `/api/admin/analytics/overview`       | —                                                         | Counts + revenue + recent bookings (30 s in-memory cache) |
| GET    | `/api/admin/settings`                 | —                                                         | Full Settings doc                                     |
| PATCH  | `/api/admin/settings`                 | `{ maintenanceMode?, maintenanceMessage? }`               | Saves singleton                                       |

### Public

| Method | Path                       | Notes                                                                         |
|--------|----------------------------|-------------------------------------------------------------------------------|
| GET    | `/api/health`              | `{ data: { status, service } }`                                               |
| GET    | `/api/packages`            | List, sorted newest. Sets `Cache-Control: public, max-age=60, swr=300`        |
| GET    | `/api/packages/:slug`      | Detail (same cache headers)                                                   |
| GET    | `/api/settings`            | Public — `{ maintenanceMode, maintenanceMessage }` only                       |
| POST   | `/api/contact`             | `authOptional` — links message to user when logged in. Length-validated.      |
| GET    | `/api/contact/me`          | `authRequired` — current user's submitted messages with reply threads         |
| POST   | `/api/newsletter`          | Email-validated upsert                                                        |
| GET    | `/api/destinations`        | Legacy stub                                                                   |

### Bookings (`/api/bookings`) — all auth required

| Method | Path                  | Body                                                                              | Notes                                                                    |
|--------|-----------------------|-----------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| POST   | `/api/bookings`       | `{ packageSlug, startDate, travelers, contact, paymentMethod, notes? }`           | Server validates date ≥ today, looks up package, computes `totalNPR`, snapshots package |
| GET    | `/api/bookings/me`    | —                                                                                 | All bookings for the signed-in user                                      |
| GET    | `/api/bookings/me/:id`| —                                                                                 | Single booking (must belong to the user)                                 |

### AI (`/api/ai`) — `authOptional` on all (anonymous works; logged-in unlocks personalization)

| Method | Path                          | Body / Query                                              | Notes                                                                                       |
|--------|-------------------------------|-----------------------------------------------------------|---------------------------------------------------------------------------------------------|
| POST   | `/api/ai/recommendations`     | `{ limit? }` (1–8, default 4)                             | Returns `{ picks: (Package & { reason })[], personalized: boolean }`. Falls back to popularity ranking if AI is offline. |
| POST   | `/api/ai/chat`                | `{ messages: { role:'user'\|'assistant', content }[] }`   | Last 10 turns kept, each clamped to 500 chars. Replies in `{ reply, suggestedSlugs, aiEnabled }`. Slugs are parsed from a `[SUGGEST: slug,…]` tag and validated against the catalog. |
| POST   | `/api/ai/itinerary/:slug`     | `{ days, adults, children }` (days clamped 1–14)          | Returns `{ itinerary: { days: [...] }, cached: boolean, aiEnabled? }`. Generated plans are cached on `Package.aiItineraryCache` per `<days>d-<bucket>` key (FIFO cap 20). |
| GET    | `/api/ai/best-season/:slug`   | —                                                         | Short timing/weather note. Cached on `Package.aiBestSeasonNote`.                            |
| POST   | `/api/ai/search`              | `{ query }` (≤200 chars)                                  | Keyword-prefilter → Gemini rerank → `{ results: (Package & { score, reason })[], aiEnabled? }`. Score 0–100. Falls back to keyword matches if AI is offline. |
| GET    | `/api/ai/similar/:slug`       | —                                                         | Deterministic similarity (category + price bucket + popularity + offer). Returns 3 packages. **Never calls Gemini.** |

All AI routes are rate-limited (see §21): `aiLimiter` (20/min) on recommendations/itinerary/best-season/search/similar; `aiChatLimiter` (8/min) on chat.

### Response envelope

```ts
type ApiSuccess<T> = { data: T; message?: string };
type ApiError     = { error: string; code?: string };  // 4xx/5xx
```

Errors carry an optional `code` for the frontend to branch on (`EMAIL_NOT_VERIFIED`, `VERIFY_EXPIRED`, `OTP_EXPIRED`, `RESET_EXPIRED`, `MAINTENANCE`). `code` is omitted in production responses to avoid leaking implementation details.

---

## 7. Type contracts (`frontend/src/types/index.ts`)

```ts
type UserRole = "user" | "admin";

type User = {
  id: string;
  name: string; username: string; email: string; phone: string;
  role: UserRole; isEmailVerified: boolean; createdAt: string;
};

type PackageCategory = "trek" | "tour" | "adventure" | "cultural" | "wildlife";

type Package = {
  id: string; slug: string; title: string; description: string;
  priceNPR: number; gallery: string[];        // up to 5
  isOffer: boolean; category: PackageCategory;
  createdAt: string;
};

type BookingStatus = "pending" | "confirmed" | "cancelled";
type PaymentMethod = "advance" | "on_arrival";
type PaymentStatus = "advance_pending" | "awaiting_arrival" | "paid";

type Booking = {
  id: string; packageSlug: string; startDate: string;
  travelers: { adults: number; children: number };
  contact: { name: string; email: string; phone: string };
  notes?: string;
  status: BookingStatus; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus;
  totalNPR: number;
  packageSnapshot?: { title: string; priceNPR: number; coverImage?: string | null };
  createdAt: string;
};

type AdminBooking = Booking & {
  user: { id; name; username; email; phone } | null;
};

type DashboardStats = {
  counts: { users; packages; bookings; bookings30d };
  revenue: { lifetimeNPR; last30dNPR };
  recentBookings: AdminBooking[];
};

type MessageStatus = "new" | "read" | "replied";
type ContactReply  = { body: string; sentAt: string; sentBy?: string };
type ContactMessage = {
  id: string; user?: string | null;
  name: string; email: string; subject: string; message: string;
  status: MessageStatus; replies: ContactReply[];
  createdAt: string; updatedAt: string;
};

type PublicSettings = { maintenanceMode: boolean; maintenanceMessage: string };
type SiteSettings  = PublicSettings & {
  id: string; key: string; createdAt: string; updatedAt: string;
};

type Paginated<T>  = { items: T[]; total: number; page: number; limit: number };
type ApiResponse<T> = { data: T; message?: string } | { error: string; code?: string };

// --- AI ---
type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };
type ChatResponse = { reply: string; suggestedSlugs: string[]; aiEnabled: boolean };

type AIRecommendation = Package & { reason: string };
type AIRecommendationsResponse = { picks: AIRecommendation[]; personalized: boolean };

type ItineraryDay = { day: number; title: string; activities: string[] };
type Itinerary = { days: ItineraryDay[] };
type ItineraryResponse = { itinerary: Itinerary; cached: boolean; aiEnabled?: boolean };

type BestSeasonResponse = { note: string; cached: boolean; aiEnabled?: boolean };

type SemanticSearchResult = Package & { score: number; reason: string };
type SemanticSearchResponse = { results: SemanticSearchResult[]; aiEnabled?: boolean };

type SimilarPackagesResponse = { results: Package[] };
```

---

## 8. State management rules

| Concern                       | Where it lives                                  |
|-------------------------------|-------------------------------------------------|
| Logged-in user                | `store/auth.store.ts` — `user`, in-memory       |
| Access token                  | `store/auth.store.ts` — `accessToken`, **in-memory only** |
| Refresh token                 | httpOnly cookie set by backend, never in JS     |
| Maintenance settings          | `MaintenanceGate` local state (mount + 60 s poll) — no store needed |
| Form fields                   | `react-hook-form` (local)                       |
| Page-local UI toggles         | `useState` (local)                              |
| Bookings/messages/packages list | Component-level fetch (no store)              |
| Filter / sort / pagination state | Component-level `useState` + `useMemo` for derived data |
| Multi-step UI (e.g. password OTP) | Component-level state machine (`stage: "enter" \| "verify" \| "done"`) |
| Admin modal state             | Component-level `useState`                      |
| Chatbot conversation          | `ChatWidget` local `useState<ChatMessage[]>` — discarded on page reload (last 10 turns sent on each request) |
| AI recommendation picks       | `AIRecommendations` component-level fetch (no store) |

**Hard rules:**
- No `persist` middleware. Reload calls `/api/auth/refresh`, not localStorage.
- One store = one concern. Stores never import each other.
- The axios client (`lib/api/client.ts`) reads `accessToken` from the store via `useAuthStore.getState()` — this is the only direct cross-cutting read.

---

## 9. Styling conventions

Tailwind v4 — **no `tailwind.config.ts`**. Theme tokens live in `frontend/src/app/globals.css` via `@theme inline`:

```
--color-brand:        #0284c7   sky-600   primary CTAs, logo, sidebar active state
--color-brand-dark:   #075985             hover state for primary
--color-brand-light:  #e0f2fe             subtle backgrounds, badges
--color-accent:       #fe8800             secondary highlights, price chips, admin role badge, offer ribbon
--color-ink:          #14141f             body text, footer/admin sidebar bg
--color-muted:        #6b7280             secondary text
--color-soft:         #f5f7fa             section backgrounds, table headers
--font-sans:          var(--font-poppins)
--font-display:       var(--font-poppins)
```

Utility classes: `bg-brand`, `text-brand`, `border-brand`, `text-ink`, `bg-soft`, `font-display`, etc.

**Other rules:**
- Mobile-first (default = 375 px); layer up with `md:`, `lg:`.
- No inline styles except dynamic values that can't be expressed as classes.
- Class composition uses `cn()` from `lib/utils.ts` (clsx + tailwind-merge).
- All images via `next/image`. See §16 for `unoptimized` rule for admin URLs.
- Card grids use `gap-8` (was `gap-6` early on — gap was bumped for better breathing room).

---

## 10. Animation strategy

- **Library:** framer-motion 12 + CSS keyframes (`animate-fade-in-up`, `animate-slide-in-down` defined in `globals.css`).
- **Card entry:** `motion.article` / `motion.button` with `initial={{ opacity: 0, y: 24 }}`, `animate={{ opacity: 1, y: 0 }}`, ease `[0.22, 1, 0.36, 1]`, 60–80 ms stagger by index (capped at 8). Re-fires on pagination / filter changes because keys change.
- **Card hover:** combined outer + inset shadow, `hover:shadow-[0_20px_45px_-20px_rgba(2,132,199,0.35),inset_0_0_0_1px_rgba(2,132,199,0.18),inset_0_-50px_70px_-40px_rgba(2,132,199,0.22)]`. `whileHover={{ y: -6 }}` for the lift.
- **Sticky navbar / image slider:** plain Tailwind `transition-*` utilities — no framer needed.
- **Banned:** jQuery, WOW.js, Animate.css.

---

## 11. Auth model — in-memory access + httpOnly refresh

Strongest practical SPA token pattern. Access token never touches disk; only the refresh cookie is persisted by the browser.

Both tokens carry an `sid` claim that points at a row in `User.sessions[]`. Every protected request re-validates `sid` against the live session table — so logout, password reset, "sign out everywhere", and per-device revoke all kill the still-unexpired access token on its very next use. For the full pattern (data model, refresh rotation, multi-device behavior, pitfalls, code skeletons, and how to port it to other stacks), see [`authhandling.md`](./authhandling.md).

| Token        | TTL    | Storage                                                            | Sent how?                         |
|--------------|--------|--------------------------------------------------------------------|-----------------------------------|
| Access JWT   | 15 min | **Zustand state** (`auth.store.accessToken`), never on disk        | `Authorization: Bearer <token>`   |
| Refresh JWT  | 7 days | `HttpOnly + Secure(prod) + SameSite=Lax` cookie, **path `/api/auth`** | Browser auto-attaches             |
| Refresh hash | persistent | `User.refreshTokenHash` in MongoDB                             | Never sent — used only server-side |

**Key flows:**
- **Login** (and verify-email auto-login): backend signs both tokens, stores `bcrypt(refresh, 12)` in DB, sets refresh cookie, returns `{ user, accessToken }` in JSON.
- **Cold reload**: `<AuthHydrator />` mounts → `auth.store.hydrate()` → `POST /api/auth/refresh` → backend rotates refresh → new access token → store populated.
- **401 mid-session**: axios response interceptor calls `/refresh` (single-flight), updates the store, retries original request. Auth-public routes excluded to avoid loops.
- **Logout**: clears refresh cookie + DB hash + in-memory state. Optimistic — local cleared *before* the backend call.
- **Refresh-token rotation**: every `/refresh` invalidates the old hash and stores a fresh one. Reused/mismatched hash wipes `refreshTokenHash` — user logged out everywhere.

`backend/src/middleware/auth.js` reads **only** `Authorization: Bearer …`. There is no access cookie.

---

## 12. Email verification

| Stage                          | Effect                                                                                          |
|--------------------------------|-------------------------------------------------------------------------------------------------|
| **Register**                   | User saved with `isEmailVerified: false`, `emailVerifyTokenHash`, `emailVerifyTokenExpires` (now + `EMAIL_VERIFY_TTL_HOURS`). Verification email sent. **No tokens issued.** |
| **TTL cleanup**                | Mongo TTL index on `emailVerifyTokenExpires` auto-deletes unverified users 24 h after token expiry (verified users have this field cleared, so they're never deleted). |
| **Re-register before verify**  | A new register with the same email/username/phone deletes the unverified record so the second person isn't blocked. |
| **Login while unverified**     | 403 `{ error, code: 'EMAIL_NOT_VERIFIED' }` — frontend shows a "Resend" button.                |
| **Verify-email link**          | `GET /api/auth/verify-email?token=&id=` → matches bcrypt hash → flips `isEmailVerified: true`, issues tokens (auto-login), redirects to `/`. |
| **Resend**                     | `POST /api/auth/resend-verification` always returns 200; only unverified accounts actually receive a new email. |

---

## 13. Roles + admin panel

`User.role` is `'user' | 'admin'`, default `'user'`. Promote in MongoDB:
```js
db.users.updateOne({ email: 'me@example.com' }, { $set: { role: 'admin' } })
```
The new role flows into the access JWT on the next login or `/refresh`.

**Admin panel** at `/admin/*` is gated by `<ProtectedRoute requireRole="admin">` (frontend) AND `authRequired + adminOnly` middleware (backend). Sections:

- **Dashboard** — 4 stat cards (users, packages, bookings 30 d, revenue 30 d) + Recent bookings list (5 latest with status). 30-second in-memory cache; busted on booking status / payment / delete writes.
- **Users** — paginated table, regex-escaped search, role toggle, self-edit blocked.
- **Packages** — full CRUD via `<PackageFormDialog>` (lazy-loaded) — title, description, priceNPR, gallery (≤5), `isOffer` checkbox, `category` select. Table shows offer pill + category pill.
- **Bookings** — search + status + paymentStatus filters; mark-paid, confirm/cancel toggle, delete (confirm dialog).
- **Messages** — search + status filter; row click opens lazy detail dialog with original message + reply thread + new-reply textarea (sends email through Gmail SMTP).
- **Settings** — maintenance toggle (with optional message). Server-side enforced via `maintenanceCheck` middleware.

The **profile page** (`/profile`) hides the bookings + messages sections for admins (admins don't book trips; admins reply to messages from `/admin/messages`). Both roles see Account info + Edit profile + Change password (OTP).

---

## 14. Validation rules (server-side, mirrored client-side)

In `backend/src/utils/validators.js` and `frontend/src/lib/validators/*.schema.ts`:

| Field      | Rule                                                                                |
|------------|-------------------------------------------------------------------------------------|
| `name`     | 2–100 characters, trimmed                                                           |
| `username` | 3–30 chars, lowercase letters/numbers/underscore (`/^[a-z0-9_]{3,30}$/`); unique   |
| `email`    | valid email; ≤200 chars; unique                                                      |
| `phone`    | `/^\+?[0-9][0-9\-\s()]{5,19}$/`; unique                                              |
| `password` | 8–256 chars; ≥1 uppercase, ≥1 lowercase, ≥1 number, ≥1 special                       |
| Package    | `title` 2–120, `description` ≥ 10, `priceNPR` ≥ 0, `gallery` ≤ 5 valid http(s) URLs, `category` enum, `isOffer` bool |
| Booking    | `startDate` ≥ today, `adults` 1–20, `children` 0–20, `paymentMethod ∈ {advance, on_arrival}` |
| Contact    | `name` 2–100, `email` valid + ≤200, `subject` 3–200, `message` 10–5000              |
| Newsletter | valid email + ≤200 chars                                                            |
| Password OTP | `/^\d{6}$/`, single-shot, 10 min TTL                                              |
| Password reset token | 32-byte hex (`crypto.randomBytes(32).toString('hex')`), bcrypt-hashed, single-shot, 60 min TTL |

Admin search params (`q`) are **regex-escaped via `escapeRegex` and clamped to 100 chars** before being passed to `$regex` (ReDoS protection).

Uniqueness on User is enforced via mongoose `unique: true` indexes plus a controller-level "verified-only" check that lets unverified placeholders be replaced.

---

## 15. Maintenance mode

A singleton `Settings` document (`{ key: 'global', maintenanceMode, maintenanceMessage }`) drives a sitewide kill-switch.

**Backend enforcement** (`middleware/maintenanceCheck.js`):
- On every request, looks up the singleton (creates on first call via `Settings.getSingleton()`).
- Exempt prefixes: `/api/health`, `/api/auth/login|refresh|logout`, `/api/admin/*`, `/api/settings`. These always pass through so the admin can recover even mid-outage.
- For non-exempt requests when `maintenanceMode === true`: decodes the access token cheaply, returns `503 { error: maintenanceMessage, code: 'MAINTENANCE' }` unless `role === 'admin'`.
- Fails open on Settings load errors (won't block traffic if DB is hiccuping).

**Frontend gate** (`components/auth/MaintenanceGate.tsx`):
- Wraps Navbar + main + Footer in `app/layout.tsx`.
- Polls `/api/settings` on mount and every 60 s.
- Always passes through admins, `/admin/*` routes, and `/login`.
- Otherwise, when `maintenanceMode === true`, renders a full-takeover maintenance screen with the custom message.

**Defense in depth:** the backend middleware is the source of truth — even if a user disables JS or hits the API directly, the public endpoints return 503.

---

## 16. Booking flow

Plan a trip:
1. Visitor opens `/destinations` (server-rendered with newest packages already in HTML) → search / filter by category / sort by price or date / paginate.
2. Click a card → `<PackageDetailDialog>` (lazy-loaded) shows title, description, image slider with arrows + dots.
3. Click **Book this trip**:
   - Not authed → `/login?next=/booking?package=<slug>` → after login, lands on the booking page.
   - Authed → straight to `/booking?package=<slug>`.
4. **`/booking`** (auth-gated layout):
   - Sectioned form: date (native `<input type="date">` with `min={today}`), travellers (+/− steppers), contact (pre-filled from profile), payment method (radio cards), notes.
   - Sticky right-side `<BookingSummary>` shows package cover, line items, total in NPR.
   - **Submit**: `POST /api/bookings` (auth-required). Server validates date, looks up package, recomputes `totalNPR`, snapshots `{title, priceNPR, coverImage}`, persists.
5. **Inline success card** with booking id, summary, payment-method-specific copy, and CTAs to `/profile` / `/destinations`.
6. **`/profile` → My bookings** lists every booking with snapshot title, total in NPR, status chip + payment-status chip.
7. **Admin** sees the booking in `/admin/bookings` with action buttons to mark paid / confirm / cancel / delete. Dashboard cache busts on any of these writes.

**Pricing:** `total = adults × priceNPR + children × Math.round(priceNPR / 2)`. Computed client-side for live preview; **always recomputed server-side** before persisting.

**Payment**: just the *choice* is recorded — no real gateway integration yet. Admin can flip `paymentStatus` to `paid` once cash/transfer arrives.

---

## 17. Password change OTP flow

`auth.controller.js` exposes `requestPasswordChange` + `confirmPasswordChange`. The User schema carries `passwordChangeOtpHash` + `passwordChangeOtpExpires` (both `select: false`, stripped from `toJSON`).

| Stage             | Endpoint                                  | Effect                                                                                  |
|-------------------|-------------------------------------------|-----------------------------------------------------------------------------------------|
| Request           | `POST /api/auth/change-password/request`  | Verifies current password → generates 6-digit OTP → bcrypt-hashes (cost 12) with 10 min expiry → emails the user. Returns `{ ok, ttlMinutes, emailHint }` (email is masked: `pd**********@…`). |
| Confirm           | `POST /api/auth/change-password/confirm`  | Validates `/^\d{6}$/`, password strength + length cap, expiry, bcrypt-compares. **Single-shot** — OTP fields cleared after every attempt. On success: sets new password. |

**Why single-shot:** 6 digits is 1 M combinations. With a long-lived multi-attempt OTP plus 5/h rate limit, an attacker could chip away at it. Invalidating after every attempt reduces every OTP to one shot — typo means request again.

**Frontend UX** (`components/profile/ChangePasswordForm.tsx`): a 3-stage state machine (`enter` → `verify` → `done`). The new password is held only in component state between steps (never persisted intermediately; only sent to the server in step 2 alongside the OTP).

---

## 18. Forgot-password flow (unauthenticated reset)

The forgot-password flow is the **only** unauthenticated way to set a new password. It deliberately uses a different mechanism from §17 because the user *cannot* prove they know the current password — proof has to come from inbox access alone.

`auth.controller.js` exposes `forgotPassword` + `resetPassword`. The User schema carries `passwordResetTokenHash` + `passwordResetTokenExpires` (both `select: false`, stripped from `toJSON`).

| Stage   | Endpoint                          | Effect                                                                                                                                                                                                                |
|---------|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Request | `POST /api/auth/forgot-password`  | Validates email. **Always returns `200 { ok: true }`** to avoid leaking which addresses are registered. Only verified accounts actually get an email — unverified placeholders are ignored. On a hit: generate 32-byte hex token → bcrypt-hash → store with 60 min expiry → email a link to `${CLIENT_URL}/reset-password?token=<raw>&id=<userId>`. |
| Confirm | `POST /api/auth/reset-password`   | Validates `{ token, id, newPassword }` (length cap 256, full password-strength rules). Looks up user by id, checks expiry, bcrypt-compares the raw token against the stored hash. **Single-shot:** the token is wiped on every attempt, success or failure. Refuses if `newPassword === currentPassword`. On success: sets new password **and clears `User.sessions[]` entirely**, then returns `200 { ok: true }`. |

**Why this is not an OTP:** the user is unauthenticated, the link must travel by email, and 60 min is the operational sweet spot for inbox latency. A 6-digit OTP over 60 min is brute-forceable; a 256-bit URL token isn't.

**Why we wipe sessions on success:** users typically reset because they suspect their account is compromised. Clearing every refresh-token hash invalidates any other device an attacker might be holding. They have to log in afresh on every device — including the one performing the reset.

**Why we always return 200 on request:** if `/forgot-password` returned 404 for unknown emails, an attacker could enumerate the user base by querying it. The user-visible UI tells everyone "If an account exists, we sent a link" regardless.

**Frontend UX:**
- `app/forgot-password/page.tsx` + `components/forms/ForgotPasswordForm.tsx`: enter email → success screen ("Check your inbox"); re-submittable to try a different address.
- `app/reset-password/page.tsx` + `app/reset-password/ResetPasswordClient.tsx`: reads `token` + `id` from `useSearchParams`, shows new-password form with strength rules mirrored from the zod schema. On success: confirmation screen with a "Sign in" CTA. On `RESET_EXPIRED` error code: full-screen "Link expired — request a new one" with deep-link back to `/forgot-password`. Token + id never leave the client to anywhere besides `/api/auth/reset-password`.
- Entry point: a **"Forgot password?"** link under the password field on `LoginForm`.

---

## 19. Image policy

- **Curated content** (heroes, About page, login panels, etc.) — Unsplash / Pexels URLs only. Hosts allowlisted in `frontend/next.config.ts` `images.remotePatterns`. Use `next/image` *with* the optimizer.
- **Admin-supplied gallery URLs** (Package gallery) — admins paste arbitrary URLs from any host. Render with `<Image … unoptimized>`. Used in the admin packages table thumbnail, home Destinations cards, destinations grid, PackageDetailDialog, BookingSummary cover.
- **Seed data** uses `picsum.photos` URLs (e.g. `picsum.photos/seed/everest-base-camp/1200/800`). Bulletproof, no domain config needed.
- **Branding** — `app/icon.svg` (P-monogram, brand gradient) becomes the favicon. `app/opengraph-image.tsx` generates a 1200×630 OG via `next/og`.
- **No `<img>` tags.** `next/image` everywhere.
- **No upload pipeline / Cloudinary.** Online URLs only.

---

## 20. Caching & performance strategy

- **`/destinations` and `/`**: server components (`async` page) fetch `/api/packages` with `next: { revalidate: 300 }`. `export const revalidate = 300` for safety. Initial packages passed as props; the client component skips its `useEffect` fetch when the prop is supplied. Search/filter/sort/pagination remain instant client-side.
- **`/api/packages` headers**: `Cache-Control: public, max-age=60, stale-while-revalidate=300` on list + getBySlug.
- **`getDashboardStats`**: 30-second module-level in-memory cache. Cache busted by `updateBookingStatus`, `updateBookingPayment`, `deleteBooking`.
- **`MaintenanceGate`**: polls `/api/settings` once on mount, then every 60 s. Does **not** refetch on pathname change.
- **Static pages**: `/about`, `/contact`, `/privacy`, `/terms`, `/not-found` use `export const dynamic = 'force-static'`.
- **Lazy-loaded dialogs** (`next/dynamic`, `ssr: false`): `PackageDetailDialog`, `PackageFormDialog`, `MessageDetailDialog`. They never appear until the user clicks something, so they don't ship in the initial bundle.
- **`loading.tsx` + `error.tsx`** at `/admin` and `/destinations` for streaming Suspense + route-level error recovery.
- **Search debounce**: `useDebounce(value, 250)` on the destinations page search input.
- **DB indexes**:
  - `Booking`: `{ user, packageSlug }` (existing) + `{ createdAt: -1 }` + `{ user: 1, createdAt: -1 }`
  - `Package`: `{ slug, isOffer, category }` (each individually) + `{ isOffer: -1, createdAt: -1 }` + `{ category: 1, createdAt: -1 }`
  - `User`: `{ email, username, phone }` unique + `{ role, isEmailVerified, emailVerifyTokenExpires }` (TTL)
  - `ContactMessage`: `{ status, user }`

---

## 21. Security headers, rate limiting, request hygiene

| Concern                | How it's addressed                                                                                                |
|------------------------|------------------------------------------------------------------------------------------------------------------|
| HTTP headers           | `helmet()` at the top of `app.js` (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)                          |
| Compression            | `compression()` after helmet                                                                                     |
| Access logs            | `morgan('dev')` in dev / `'combined'` in prod (silent in `test`)                                                 |
| Trust proxy            | `app.set('trust proxy', 1)` so rate limiting + IP logic see the real client behind a load balancer               |
| Body size              | `express.json({ limit: '50kb' })` and `urlencoded` likewise                                                       |
| CORS                   | `origin: process.env.CLIENT_URL`, `credentials: true` — fails closed if `CLIENT_URL` is missing (validated at boot) |
| Env validation         | `server.js` exits if any of `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL` is missing      |
| Rate limiters          | `middleware/rateLimits.js`: login 10/15 min · register 5/h · resend-verify 3/h · password-change 5/h · `passwordResetLimiter` 5/h (shared by forgot-password + reset-password) · contact 5/h · newsletter 3/h · `aiLimiter` 20/min · `aiChatLimiter` 8/min |
| ReDoS                  | `escapeRegex` from `utils/validators.js` applied to every admin `$regex` filter; `q` is also clamped to 100 chars |
| Bcrypt cost            | 12 rounds for passwords + refresh-token + email-verify hashes + password-change OTP                                |
| `User.toJSON`          | Schema-level transform deletes `passwordHash`, `refreshTokenHash`, `emailVerifyTokenHash`, `emailVerifyTokenExpires`, `passwordChangeOtpHash`, `passwordChangeOtpExpires` |
| `strict: true` schemas | Every Mongoose model has `strict: true` so unknown fields in `req.body` are silently dropped                      |
| Error sanitisation     | `errorHandler` only includes `err.code` when `NODE_ENV !== 'production'`                                          |

---

## 22. Environment variables

### Backend (`backend/.env` — gitignored)

| Var                         | Purpose                                                                |
|-----------------------------|------------------------------------------------------------------------|
| `NODE_ENV`                  | `development` / `production` — toggles cookie `secure`, error.code, morgan format |
| `PORT`                      | Express port (default 5000)                                            |
| `CLIENT_URL`                | Frontend origin allowed by CORS + used in verification email links     |
| `MONGO_URI`                 | Atlas / local connection string                                        |
| `JWT_ACCESS_SECRET`         | 96-char hex; sign/verify access JWTs                                   |
| `JWT_REFRESH_SECRET`        | Different 96-char hex; sign/verify refresh JWTs                        |
| `JWT_ACCESS_EXPIRES_IN`     | `15m`                                                                  |
| `JWT_REFRESH_EXPIRES_IN`    | `7d`                                                                   |
| `EMAIL_VERIFY_TTL_HOURS`    | Optional. Email verification TTL (default 24)                          |
| `SMTP_HOST/PORT/SECURE`     | `smtp.gmail.com` / `465` / `true`                                      |
| `SMTP_USER`                 | Gmail address                                                          |
| `SMTP_PASS`                 | 16-char Gmail App Password                                             |
| `SMTP_FROM_NAME`            | `Pokhara Tours and Travel`                                             |
| `GEMINI_API_KEY`            | Optional. Google AI Studio API key. If missing, all `/api/ai/*` endpoints stay reachable but serve fallback (non-AI) responses. |
| `ESEWA_MERCHANT_CODE`       | eSewa merchant/product code embedded in the signed payload.            |
| `ESEWA_SECRET_KEY`          | HMAC-SHA256 secret used to sign init payloads and verify callbacks.    |
| `ESEWA_PAYMENT_URL`         | eSewa form endpoint the user is redirected to.                         |
| `ESEWA_STATUS_URL`          | eSewa transaction-status check endpoint (server-to-server).            |
| `ESEWA_SUCCESS_URL`         | Frontend URL eSewa redirects to on success.                            |
| `ESEWA_FAILURE_URL`         | Frontend URL eSewa redirects to on failure.                            |

The first four are validated at startup — the process exits if missing.

### Frontend (`frontend/.env.local` — gitignored)

| Var                    | Purpose                                                                |
|------------------------|------------------------------------------------------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend base URL                                                       |
| `NEXT_PUBLIC_APP_NAME` | `Pokhara Tours and Travel`                                             |

---

## 23. AI features (Google Gemini integration)

The AI layer is a **product enhancement, not a dependency** — every endpoint ships a deterministic fallback so the site behaves identically when `GEMINI_API_KEY` is missing, the quota is exhausted, or the network call fails. Logs note the fallback but the user sees a useful response either way.

### Stack

- **SDK:** `@google/generative-ai` (Node SDK).
- **Models:** primary `gemini-2.5-flash`, fallback `gemini-flash-lite-latest`. `gemini.client.js` retries on quota errors (`/429|quota|rate.?limit/i`) before falling through to the route-level fallback.
- **Modes:** `generateText`, `generateJSON` (`responseMimeType: 'application/json'`), `generateChat` (multi-turn with system instruction).
- **Module-level memo:** generative-model instances are cached per `(modelName, systemInstruction-prefix)` to avoid re-instantiation on every request.

### File map

```
backend/src/
├── controllers/ai.controller.js         6 handlers (recommendations, chat, itinerary, bestSeason, search, similar)
├── routes/ai.routes.js                  POST/GET wiring + authOptional + rate limiters
├── services/ai/
│   ├── gemini.client.js                 isEnabled() · generateText · generateJSON · generateChat (primary→fallback)
│   ├── popularity.service.js            5-min in-memory cache:
│   │                                    getPopularPackages · getCategoryAffinity(userId)
│   │                                    · getUserBookedSlugs(userId) · getSeasonalDistribution(slug)
│   └── prompts.js                       recommendationPrompt · chatSystemPrompt · packageCatalog
│                                        · itineraryPrompt · bestSeasonPrompt · semanticSearchPrompt
└── models/Package.js                    + aiBestSeasonNote: string
                                         + aiItineraryCache: [{ key, content, generatedAt }]  (FIFO cap 20)

frontend/src/
├── components/ai/
│   ├── AIRecommendations.tsx            home-page "Recommended / Trending" 4-card grid (RSC sibling of <Hero/>)
│   └── ChatWidget.tsx                   floating button + popup chat; mounted in app/layout.tsx (global)
├── lib/api/ai.service.ts                6 typed fns (recommendations, chat, itinerary, bestSeason, search, similar)
├── lib/validators/ai.schema.ts          zod for chat input shape
└── types/index.ts                       ChatMessage · AIRecommendation · Itinerary · etc.
```

### Features in detail

1. **AI recommendations** — `POST /api/ai/recommendations`
   - Pulls popularity (top-20 most-booked), the user's category affinity (if logged in), and their already-booked slugs.
   - Builds a shortlist of 12 candidates (filtering out already-booked), sorted by popularity then offer flag.
   - Asks Gemini in JSON mode to return `{ picks: [{ slug, reason }] }`; backend enriches each pick with the full Package + clamps `reason` to 200 chars.
   - **Fallback:** returns the popularity-sorted shortlist with a canned reason.
   - **Personalization flag** flips on when the user is logged in AND has category affinity (i.e. at least one prior booking).

2. **Travel chatbot** — `POST /api/ai/chat`
   - Last 10 turns are sent (older trimmed), each clamped to 500 chars.
   - System prompt contains the full live catalog (title, slug, priceNPR, category, offer flag) so the model only recommends real packages.
   - Reply may include a `[SUGGEST: slug1, slug2]` tag — the backend parses it, validates against the catalog, strips it from the visible reply, and returns the matched slugs alongside.
   - Frontend renders each slug as a chip that links to `/destinations?slug=<slug>`.
   - **Fallback:** canned "AI is offline" message + `aiEnabled: false`.

3. **Itinerary generator** — `POST /api/ai/itinerary/:slug`
   - Input: `{ days (1–14), adults, children }`. Cache key is `<days>d-<adults>a[-<children>c]`.
   - Cache lives on `Package.aiItineraryCache[]` (FIFO, capped at 20 entries). Hit → return parsed JSON with `cached: true`. Miss → call Gemini in JSON mode, persist, return.
   - **Fallback:** generic Arrival → Exploration → Return scaffold.

4. **Best-season note** — `GET /api/ai/best-season/:slug`
   - Cached on `Package.aiBestSeasonNote` (single string, capped at 240 chars).
   - Gemini gets the package context + a seasonal booking distribution to inform its answer.
   - **Fallback:** "September through November" canned note.

5. **Semantic search** — `POST /api/ai/search`
   - Pre-filters with a regex-OR of the first 5 query tokens (escaped via `escapeRegex`), top 20 candidates → Gemini ranks them with `{ slug, score (0–100), reason }`.
   - **Fallback:** keyword matches with `score: 50` and a "Keyword match" reason. Query is capped at 200 chars.

6. **Similar packages** — `GET /api/ai/similar/:slug`
   - **Pure heuristic — no AI call.** Scores candidates by: same category (+50), same price bucket (+25), price delta (up to +15), popularity (up to +20), `isOffer` (+5). Returns top 3.

### Security / hygiene

- All AI routes use `authOptional` — logged-in users get personalization, anonymous users still get useful results.
- `aiLimiter` (20 req/min) on the heavier endpoints; `aiChatLimiter` (8 req/min) on `/chat` to discourage abusive multi-turn sessions.
- Chat input is hard-clamped (10 turns × 500 chars each) before being shipped to Gemini.
- Semantic-search query is clamped at 200 chars; tokens used in the pre-filter regex are escaped via `escapeRegex`.
- Suggestion tags in chat replies are validated against the live catalog before being surfaced — the model cannot inject arbitrary URLs.
- The Gemini SDK call never blocks the response: on any thrown error the controller logs `console.warn` and returns the fallback shape with `aiEnabled: true` so the UI knows the feature is configured but transiently down.

### Caching strategy

| Surface                       | Where                                                | TTL / size                       |
|-------------------------------|------------------------------------------------------|----------------------------------|
| Popularity / category affinity / user history / seasonal | `services/ai/popularity.service.js` module map | 5 min in-memory                  |
| Itinerary plans               | `Package.aiItineraryCache[]`                         | Persistent; FIFO cap 20 / package |
| Best-season note              | `Package.aiBestSeasonNote`                           | Persistent (single string)       |
| Generative-model handles      | `services/ai/gemini.client.js` `modelCache`          | Process-lifetime memo            |

### Open trade-offs

- **No user-scoped itinerary cache** — two users asking for the same `{slug, days, adults, children}` share the same plan. Acceptable while plans are generic; revisit if we add per-user constraints.
- **Popularity cache is per-process** — behind multiple Node instances the cache is duplicated. Fine until we shard.
- **AI cost is unbounded by route quota** but bounded by `aiLimiter` per-IP and by client-side single-call usage (recommendations is fetched once per home view; itinerary is gated behind a CTA).
- **No server-side moderation on chat input** — relying on Gemini's own safety filters today. Add a pre-flight classifier if abuse appears.

---

## 24. Out of scope / deferred

- Stripe / international card gateway. (eSewa is wired — see §1.)
- Khalti gateway — only eSewa is wired today.
- Email confirmation on successful booking — easy to add (mailer wired); deferring.
- Date *range* (start + end) — single date for now.
- Custom calendar UI (react-day-picker) — native input is fine.
- CSRF token middleware — not needed: Authorization-header model + path-scoped refresh cookie + SameSite=Lax suffice.
- i18n (English / Nepali) — `next-intl` planned later.
- Image upload pipeline / Cloudinary — using online URLs only.
- Inbound email parsing for replies to admin messages — currently the user replies to the admin email, which goes to `hello@pokharatours.com` (not parsed back into the system).

---

## 25. Change log

| Date       | Change                                                                                  |
|------------|-----------------------------------------------------------------------------------------|
| 2026-05-01 | Initial architecture authored (frontend-only plan stage).                               |
| 2026-05-01 | Backend built: Express 5 + Mongoose, JWT auth with email verification.                  |
| 2026-05-01 | Auth hardened: in-memory access token + httpOnly refresh cookie pattern.                |
| 2026-05-01 | Frontend Home / Login / Register / Verify-Email pages built; Navbar + Footer.           |
| 2026-05-01 | Username field added; password requires upper/lower/number/special.                     |
| 2026-05-01 | Profile page (Account / Edit / Change password / My bookings); admin profile hides bookings. |
| 2026-05-01 | Admin panel: layout + sidebar; Users CRUD wired; Packages CRUD wired; Dashboard / Offers / About / Settings as placeholders. |
| 2026-05-01 | Package model simplified to `{ title, description, priceNPR, gallery (≤5), slug }`.     |
| 2026-05-01 | Public `/about` page built; home Destinations + `/destinations` driven by real packages from API. |
| 2026-05-01 | `<PackageDetailDialog>` with image slider replaces planned `/destinations/[slug]`.      |
| 2026-05-01 | Booking flow end-to-end: `/booking?package=<slug>` → server-recomputed total → My Bookings. |
| 2026-05-02 | Admin Bookings page (search/filters + mark paid / confirm / cancel / delete).           |
| 2026-05-02 | Dashboard wired to real data: `/api/admin/analytics/overview` + Recent bookings list.   |
| 2026-05-02 | Home Destinations switched to newest 3 with offer-priority sort; card gap bumped to gap-8. |
| 2026-05-02 | `isOffer` boolean added to Package; admin form toggle; offers section first on `/destinations`. |
| 2026-05-02 | Seed script (`backend/src/scripts/seedPackages.js`): 20 regular + 10 offer Nepal packages, idempotent upsert by slug. |
| 2026-05-02 | `category` enum (trek/tour/adventure/cultural/wildlife) added to Package; admin form select; destinations search/category/sort/pagination + `useDebounce` hook + memoized cards. |
| 2026-05-02 | Card animations (framer-motion entry + inset hover shadow) on home + destinations.      |
| 2026-05-02 | `/contact`, `/privacy`, `/terms`, `not-found` pages added; footer Quick Links wired.    |
| 2026-05-02 | Settings model + admin Settings page + Maintenance mode (frontend `MaintenanceGate` + backend `maintenanceCheck` middleware). |
| 2026-05-02 | Contact form wired end-to-end: `ContactMessage` extended with `status` + `replies[]` + optional `user` link; admin Messages page (list / filter / reply via SMTP / delete); user `MyMessages` profile section. |
| 2026-05-02 | P0 security: helmet, express-rate-limit (per-endpoint), compression, morgan, server-side maintenance enforcement, env validation at boot, regex escape, body limit 50 kb, bcrypt 12, defensive `User.toJSON`, `strict: true` on all schemas, error code sanitisation. |
| 2026-05-02 | P1 performance: ISR on `/destinations` + home (revalidate 300), `Cache-Control` on `/api/packages`, dashboard 30 s cache, MaintenanceGate poll every 60 s (no per-route refetch), `force-static` on legal pages, `loading.tsx` + `error.tsx` for `/admin` + `/destinations`, lazy-loaded dialogs (`PackageDetailDialog`, `PackageFormDialog`, `MessageDetailDialog`). |
| 2026-05-02 | P2 polish: admin pages export `metadata`, DB indexes (Booking `createdAt`, Package `isOffer + createdAt`), `EMAIL_VERIFY_TTL_HOURS` env, branded `app/icon.svg` + programmatic `app/opengraph-image.tsx`. |
| 2026-05-02 | Password-change OTP flow: 6-digit single-shot OTP via Gmail SMTP, two endpoints (`/change-password/request` + `/confirm`), 3-stage frontend state machine. |
| 2026-05-14 | **Google Gemini AI integration** completed: `services/ai/{gemini.client,popularity.service,prompts}.js`, `controllers/ai.controller.js`, `routes/ai.routes.js`. Six endpoints (`recommendations`, `chat`, `itinerary/:slug`, `best-season/:slug`, `search`, `similar/:slug`) with primary→fallback model retry, deterministic non-AI fallbacks, and `aiLimiter` / `aiChatLimiter` rate limits. Package model extended with `aiBestSeasonNote` + `aiItineraryCache[]`. Frontend: home-page `AIRecommendations` section and global `ChatWidget` (mounted in `app/layout.tsx`); typed `ai.service.ts`; `ChatMessage`, `AIRecommendation`, `Itinerary`, `SemanticSearchResult` types. New env var `GEMINI_API_KEY` (optional — endpoints degrade to fallbacks if missing). See §23. |
| 2026-05-14 | **Self-service booking cancellation** shipped: `PATCH /api/bookings/me/:id/cancel` (rate-limited) + `bookings.service.cancelMine` + Cancel CTA on `/profile → My bookings`. Server-side rule: only the booking owner can cancel, only when `startDate − now ≥ 24 h`, and only when status is not already `cancelled`. Migrates the prior admin-only flow. |
| 2026-05-14 | **eSewa online payment** wired for `advance` bookings: `POST /api/bookings/:id/esewa-init` (signed payload + `esewaTransactionUuid` on the Booking) → gateway redirect → `POST /api/bookings/esewa-verify` (signed callback, no auth — eSewa signature is the gate) → server-side status check (`checkEsewaStatus`) → `paymentStatus: 'paid'`. New env vars: `ESEWA_MERCHANT_CODE`, `ESEWA_SECRET_KEY`, `ESEWA_PAYMENT_URL`, `ESEWA_STATUS_URL`. |
| 2026-05-14 | **Forgot-password flow** shipped. Two unauthenticated endpoints: `POST /api/auth/forgot-password` (always returns 200 to avoid enumeration; emails a signed link only to verified accounts) + `POST /api/auth/reset-password` ({ token, id, newPassword }, single-shot, 60 min TTL). New User fields: `passwordResetTokenHash` + `passwordResetTokenExpires` (`select: false`, stripped from `toJSON`). Success clears `User.sessions[]` so every existing device is logged out. New `passwordResetLimiter` (5/h) shared by both endpoints. New mailer template `sendPasswordResetEmail`. New error code `RESET_EXPIRED`. Frontend: `/forgot-password` + `/reset-password` pages with their forms; **"Forgot password?"** link added to `LoginForm`; new zod schemas `forgotPasswordSchema` + `resetPasswordSchema`; service methods `authService.forgotPassword` / `authService.resetPassword`. See §18. |
| 2026-05-14 | **Security hardening pass — critical & high audit items shipped.** (1) Access tokens are now session-bound — `authRequired`/`authOptional` validate `sid` against `User.sessions[]` on every protected request and bump `lastUsedAt`. Stolen access tokens die on logout/password-reset/session-revoke instead of surviving 15 min. (2) Constant-time login (`DUMMY_PASSWORD_HASH` at boot) closes the email-enumeration timing channel. (3) Per-account login rate limiter (`loginPerEmailLimiter`, 5/15min keyed on email) + 2FA-stage limiter on top of the existing per-IP one. (4) `safeNextPath` in `lib/utils.ts` rejects `//evil.com` and `/\\evil.com` open-redirects from `?next=`. (5) Custom morgan `:safe-url` token redacts `token`/`code`/`otp`/`secret`/`signature`/`data` query params from access logs. (6) `sanitizeHeader()` strips CR/LF from all SMTP headers across all 5 mailer templates. (7) Tighter `validateGalleryUrl` (https-only, no userinfo, no IP-literal hosts, length ≤ 500) shared between backend and admin dialog. (8) `maintenanceCheck` now fails closed with a 30s settings cache. (9) Per-user AI rate limiters (`aiLimiterPerUser` 10/min, `aiChatLimiterPerUser` 3/min) layered on the existing per-IP ones. |
| 2026-05-14 | **`authhandling.md`** — portable, stack-agnostic write-up of the session-bound JWT pattern + multi-device session model used here. Covers data model, login/validation/refresh flows, multi-device behavior, FIFO prune, common pitfalls, migration tips, and code skeletons. Reference table maps each concept to the file in this repo. Cross-linked from §11 above and from `README.md`. |
| 2026-05-14 | **TOTP 2FA + multi-device sessions** shipped. Auth: `User.totpEnabled`/`totpSecret` (`select: false`); endpoints `POST /api/auth/2fa/{setup,enable,disable}` and 2-stage login `/login → /login/2fa` with a short-lived signed 2FA challenge token (`purpose: '2fa'`). Sessions: `User.sessions[]` (`deviceLabel`, `ip`, `userAgent`, `lastUsedAt`, `refreshTokenHash`), cap 10/user with FIFO prune; access + refresh JWTs carry an `sid` claim bound to the session row. Endpoints `GET /api/auth/sessions`, `DELETE /api/auth/sessions/:id`, `DELETE /api/auth/sessions` (revoke others). Refresh rotation now updates only the matched session's hash; mismatched hash revokes that one session, not all of them. Frontend: 2FA challenge stage in `LoginForm`, `Enable2FAForm` / `Disable2FAForm` and `SessionsList` on `/profile`. `migrateSessions.js` script backfills the new shape for legacy users. New rate limiters `twoFactorLimiter`, `sessionsLimiter`, `bookingCancelLimiter`, `esewaLimiter`. |
