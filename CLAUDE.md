# CLAUDE.md — Working guide for Pokhara Tours and Travel

> Read this first. For the *why* behind any decision, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 1. Project at a glance

- **Name:** Pokhara Tours and Travel — Nepal-focused travel agency.
- **Repo shape:** Monorepo with two apps: `backend/` and `frontend/`.
- **Stack (installed versions, May 2026):**
  - **Backend:** Node.js · Express 5.2 · MongoDB Atlas · Mongoose 9.6 · jsonwebtoken 9 · bcryptjs 3 · cookie-parser 1.4 · cors 2.8 · helmet · express-rate-limit · compression · morgan · dotenv 17 · nodemailer 8 · nodemon 3
  - **Frontend:** Next.js 16.2 (App Router) · React 19.2 · TypeScript 5 · Tailwind CSS 4 · Zustand 5 · axios 1.15 · zod 4 · react-hook-form 7 · framer-motion 12 · lucide-react 1.14 · clsx · tailwind-merge
- **Brand:** logo "Pokhara Tours and Travel" in **Poppins**, blue **`#0284c7`** (sky-600), accent orange **`#fe8800`**.
- **What's live:**
  - Public site: Home (RSC newest-3, offer-priority) · About · Destinations (search + category + sort + pagination, ISR 5 min) · Contact · Privacy · Terms · branded 404
  - Auth: register → email verify → login → silent refresh → logout · **password change uses a 6-digit email OTP** (single-shot, 10 min)
  - Profile: account info · edit · OTP change-password · my bookings · my messages
  - Admin: Dashboard (live counts + 30 s cache) · Users · Packages (offer + category) · Bookings · Messages (reply via email) · Settings (maintenance toggle)
  - Maintenance mode (frontend gate + server middleware) · per-endpoint rate limiting · helmet · compression

> **Heads-up:** Next.js 16 + React 19 + Tailwind 4 + lucide-react 1.14 ship with breaking changes vs older training data. Before writing Next.js code, peek at `frontend/node_modules/next/dist/docs/` for the current API. Lucide brand glyphs (Facebook, Twitter, Instagram, etc.) are **removed** — use `frontend/src/components/layout/SocialIcons.tsx`.

---

## 2. Commands

### Backend (`cd backend`)
```bash
npm install
cp .env.example .env        # edit values: MONGO_URI, JWT secrets, CLIENT_URL, SMTP_*
npm run dev                 # nodemon, http://localhost:5000
npm start                   # production

# Seed 30 Nepal packages (20 regular + 10 offers). Idempotent upsert by slug.
node src/scripts/seedPackages.js
```

### Frontend (`cd frontend`)
```bash
npm install
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev                 # http://localhost:3000
npx tsc --noEmit            # type-check before declaring a task done
npm run lint
npm run build
```

> Run **both** `dev` servers in separate terminals — the frontend talks to the backend at `NEXT_PUBLIC_API_URL`.

---

## 3. Folder map

```
tours and travel/
├── ARCHITECTURE.md              ← architecture + decision log
├── CLAUDE.md                    ← this file
├── backend/
│   └── src/
│       ├── server.js                        Boot (validates required .env)
│       ├── app.js                           helmet · compression · morgan · CORS · trust proxy
│       │                                    · cookieParser · maintenance gate · routes · errorHandler
│       ├── config/db.js                     mongoose.connect()
│       ├── controllers/
│       │   ├── auth.controller.js           register/login/verify/refresh/logout/me/updateMe
│       │   │                                + requestPasswordChange + confirmPasswordChange (OTP)
│       │   ├── admin.controller.js          users + packages + bookings + messages + analytics + settings
│       │   ├── packages.controller.js       public list + getBySlug (with Cache-Control headers)
│       │   ├── bookings.controller.js       create / listMine / getMine
│       │   ├── contact.controller.js        submit (authOptional) / listMine
│       │   ├── settings.controller.js       public GET (maintenance only)
│       │   ├── newsletter.controller.js
│       │   └── destinations.controller.js   legacy stub
│       ├── models/  (all use strict: true)
│       │   ├── User.js                      role + email verify + refreshTokenHash + passwordChangeOtp
│       │   ├── Package.js                   slug/title/description/priceNPR/gallery/isOffer/category
│       │   ├── Booking.js                   user/packageSlug/startDate/travelers/contact/payment*/totalNPR/snapshot/status
│       │   ├── ContactMessage.js            name/email/subject/message/status/replies[]/user?
│       │   ├── Settings.js                  singleton (key='global')
│       │   ├── Destination.js               legacy
│       │   └── NewsletterSubscriber.js
│       ├── middleware/                      auth (Bearer + authOptional + adminOnly)
│       │                                    · rateLimits · maintenanceCheck · errorHandler · notFound
│       ├── routes/                          auth · admin · packages · bookings · contact
│       │                                    · newsletter · settings · destinations
│       ├── scripts/seedPackages.js          20 regular + 10 offer Nepal packages
│       └── utils/                           tokens · mailer (verify + contact reply + password OTP)
│                                            · validators (email/phone/username + escapeRegex) · slugify
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx                   AuthHydrator + MaintenanceGate{Navbar + main + Footer}
        │   ├── page.tsx                     Home (async RSC, ISR)
        │   ├── icon.svg                     Branded favicon
        │   ├── opengraph-image.tsx          1200×630 PNG via next/og
        │   ├── not-found.tsx                Branded 404 (force-static)
        │   ├── about/page.tsx               force-static
        │   ├── contact/                     page.tsx (force-static) + ContactForm.tsx
        │   ├── privacy/page.tsx             force-static
        │   ├── terms/page.tsx               force-static
        │   ├── destinations/                page.tsx (RSC + ISR) + DestinationsClient + loading.tsx
        │   ├── login/page.tsx               Suspense
        │   ├── register/page.tsx            Suspense
        │   ├── verify-email/                Suspense + VerifyEmailClient
        │   ├── profile/                     layout (auth) + page + ProfileClient
        │   ├── booking/                     layout (auth) + page + BookingClient
        │   └── admin/                       layout + page (redirect) + loading.tsx + error.tsx
        │       ├── dashboard/page.tsx + DashboardClient.tsx
        │       ├── users/page.tsx + UsersClient.tsx
        │       ├── packages/page.tsx + PackagesClient.tsx
        │       ├── bookings/page.tsx + BookingsClient.tsx
        │       ├── messages/page.tsx + MessagesClient.tsx + MessageDetailDialog.tsx
        │       ├── settings/page.tsx + SettingsClient.tsx
        │       └── about/page.tsx           placeholder
        ├── components/
        │   ├── layout/                      Navbar, Footer, Logo, SocialIcons
        │   ├── home/                        Hero, About, Services, Destinations, ContactCTA
        │   ├── forms/                       LoginForm, RegisterForm
        │   ├── auth/                        AuthHydrator, ProtectedRoute, MaintenanceGate
        │   ├── profile/                     EditProfileForm, ChangePasswordForm (OTP), MyBookings, MyMessages
        │   ├── admin/                       AdminSidebar, PageHeader, Placeholder, PackageFormDialog
        │   ├── packages/                    PackageDetailDialog (image slider + Book CTA)
        │   ├── booking/                     DateField, TravelerCounter, PaymentMethodSelect, BookingSummary
        │   └── ui/                          Pagination
        ├── lib/
        │   ├── api/                         client.ts + auth · admin · packages · bookings · contact · settings services
        │   ├── validators/                  auth · package · booking · contact (zod)
        │   ├── hooks/                       useDebounce
        │   └── utils.ts                     cn() · formatNPR()
        ├── store/                           auth.store.ts (no persist)
        └── types/                           index.ts (User · Package · Booking · ContactMessage · Settings · DashboardStats · …)
```

Boundaries are enforced — see `ARCHITECTURE.md` §4. Most importantly: **components never import from `lib/api/*`**, and **stores never import each other**.

---

## 4. Naming conventions

| Kind                | Convention                          | Example                                |
|---------------------|-------------------------------------|----------------------------------------|
| React component     | `PascalCase.tsx`                    | `PackageDetailDialog.tsx`              |
| Page route folder   | `kebab-case`                        | `verify-email/page.tsx`                |
| Page client island  | `<PageName>Client.tsx`              | `BookingsClient.tsx`                   |
| Hook                | `useX.ts`                           | `useDebounce.ts`                       |
| Zustand store       | `<concern>.store.ts`                | `auth.store.ts`                        |
| API service (FE)    | `<resource>.service.ts`             | `settings.service.ts`                  |
| Validator (zod)     | `<feature>.schema.ts`               | `contact.schema.ts`                    |
| TS type             | `PascalCase`                        | `ContactMessage`, `DashboardStats`     |
| Express controller  | `<resource>.controller.js`          | `bookings.controller.js`               |
| Express route file  | `<resource>.routes.js`              | `admin.routes.js`                      |
| Express middleware  | `<concern>.js`                      | `rateLimits.js`, `maintenanceCheck.js` |
| Mongoose model file | `PascalCase.js`                     | `Settings.js`                          |
| One-off script      | `<verb><Noun>.js` in `src/scripts/` | `seedPackages.js`                      |

---

## 5. How to add things (recipes)

### A new public page (e.g. `/blog`)
1. `frontend/src/app/blog/page.tsx` — export default React component.
2. Export `metadata: Metadata = { title, description }` for SEO.
3. If purely static, add `export const dynamic = 'force-static'` to lock it as SSG.
4. Add link to `Navbar.tsx` (`NAV_LINKS`) and/or `Footer.tsx` if it should appear.
5. Need interactivity? Move the body to a sibling `BlogClient.tsx` (`"use client"`) and let `page.tsx` render it inside `<Suspense>` if it uses `useSearchParams`.

### A new auth-gated page
1. Create `app/<route>/layout.tsx` that wraps `{children}` in `<ProtectedRoute>` (or `<ProtectedRoute requireRole="admin">`).
2. Add `app/<route>/page.tsx` and a client island.
3. Optional: redirect target like `/login?next=…` is auto-handled by `ProtectedRoute`.

### A new component
1. Pick the bucket: `layout`, `home`, `forms`, `auth`, `profile`, `admin`, `packages`, `booking`, `ui`. Create the bucket only if needed.
2. File: `components/<bucket>/<Name>.tsx`. PascalCase.
3. Define `type Props = { … }` directly above the component.
4. Named export (default-export only for Next pages/layouts).
5. No business logic — read from a store or accept props.
6. Client interaction? Add `"use client"` at top.
7. Likely-to-be-heavy modals: import via `next/dynamic` with `ssr: false` so they don't ship in the initial bundle. See `PackageDetailDialog` usage.

### A new Zustand store
1. File: `frontend/src/store/<concern>.store.ts`.
2. `create<State>()((set, get) => ({ … }))`.
3. Keep state flat. Actions are functions on the same object.
4. **Don't** wrap with `persist` for auth/session-related state.
5. Don't import from another store.

### A new frontend API service
1. File: `frontend/src/lib/api/<resource>.service.ts`.
2. Import the shared `apiClient` from `lib/api/client.ts`. Don't create a new axios instance.
3. Each function returns the typed unwrapped data, not the raw axios response.
4. Errors propagate; callers use `extractApiError(err)` to display them.

### A new backend endpoint
1. **Model** (`backend/src/models/<Name>.js`) — Mongoose schema with `strict: true`. Add a `toJSON` transform mapping `_id` → `id`. If it has secret fields, also delete them in the transform.
2. **Controller** (`backend/src/controllers/<resource>.controller.js`) — thin async fns calling `next(err)` on failure.
3. **Routes** (`backend/src/routes/<resource>.routes.js`) — `express.Router()`, mount handlers.
4. **Wire** in `backend/src/app.js`: `app.use('/api/<resource>', require('./routes/<resource>.routes'))`. **Mount before `notFound`/`errorHandler`.**
5. Auth: `router.get('/', authRequired, controller)`. Optional auth (e.g. for endpoints that work better when logged in but allow anonymous): `authOptional`. Admin-only: chain `authRequired, adminOnly`.
6. Public unauthenticated reads should still be subject to the maintenance gate — the `maintenanceCheck` middleware is applied globally in `app.js`. If your endpoint must remain reachable during maintenance (rare), add the path to `EXEMPT_PREFIXES` in `middleware/maintenanceCheck.js`.

### A new admin endpoint
1. Add the controller fn to `backend/src/controllers/admin.controller.js`.
2. Add the route to `backend/src/routes/admin.routes.js` (the `router.use(authRequired, adminOnly)` at the top of that file gates everything).
3. Add a corresponding fn to `frontend/src/lib/api/admin.service.ts`.
4. Wire it from an admin page under `frontend/src/app/admin/<section>/`.

### A new admin page
1. Add an entry to the `ITEMS` array in `frontend/src/components/admin/AdminSidebar.tsx` (label, href, lucide icon).
2. Create `app/admin/<section>/page.tsx` exporting `metadata`. For client-side data, follow the pattern in `bookings/BookingsClient.tsx` or `messages/MessagesClient.tsx`.
3. Use `<PageHeader>` for the title strip.
4. `loading.tsx` + `error.tsx` boundaries are inherited from `app/admin/`.

### A new form
1. zod schema in `frontend/src/lib/validators/<feature>.schema.ts`.
2. Component in `frontend/src/components/forms/<Form>.tsx` (or feature folder) with `"use client"`.
3. `useForm({ resolver: zodResolver(schema), defaultValues: { … } })`.
4. Submit handler calls a store action (which calls a service).
5. Show pending / error / success states explicitly. Use `extractApiError(err)` for messages.
6. Rate-limited backend route? Be ready for `429`. Surface "Too many requests, try again later." through `extractApiError`.

### A new image
1. **Static curated** image — Unsplash/Pexels URL. Use `<Image …>` (optimized). New host? Add to `frontend/next.config.ts` → `images.remotePatterns`.
2. **Admin-supplied** URL — render with `<Image … unoptimized>`. The optimizer's host check is bypassed.
3. **Seed data** — `picsum.photos` is reliable; no domain config needed (it's already in the allowlist).
4. **Never** `<img>`. **Never** drop binary images in `public/`.

### A new mailer template
1. Add a function next to `sendVerificationEmail` / `sendContactReply` / `sendPasswordChangeOtp` in `backend/src/utils/mailer.js`.
2. Reuse the inline-HTML pattern. Keep templates Gmail-safe (no external CSS).
3. Always wrap variable interpolation in the existing `escapeHtml` helper.

### A new rate-limited route
1. Add the limiter to `backend/src/middleware/rateLimits.js` (mirror the existing pattern: window + max + standard message).
2. Apply it in the route file *before* the controller: `router.post('/x', limiter, handler)`.

### A new field that should be hidden from JSON
1. Add the field to the model with `select: false`.
2. Add the field name to the schema-level `toJSON.transform` so accidental JSON-stringification of a `select('+field')` doc doesn't leak it. See `User.js` for the pattern.

---

## 6. Auth pattern (cheat sheet)

- **Access token**: signed JWT, 15 min, returned in JSON, kept in `auth.store.accessToken` (memory only).
- **Refresh token**: signed JWT, 7 days, **httpOnly cookie**, scoped to `/api/auth`. Hash stored in `User.refreshTokenHash` (bcrypt cost 12).
- **Authorization header**: `apiClient` request interceptor adds `Authorization: Bearer <accessToken>` from the store on every non-public call.
- **401 retry**: response interceptor calls `/api/auth/refresh` (single-flight), updates store, retries original request.
- **Cold reload**: `<AuthHydrator />` calls `auth.store.hydrate()` → `/api/auth/refresh` → store populated if a valid refresh cookie is present.
- **Logout**: optimistic — store cleared *first* (synchronous), then `authService.logout()` clears cookie + DB hash.
- **Password change**: 2-step OTP flow. `requestPasswordChange({ currentPassword })` sends a 6-digit code by email; `confirmPasswordChange({ otp, newPassword })` sets the password. Single-shot OTP (10 min TTL), stored as bcrypt hash on the user.

What **never** lives in localStorage or non-HttpOnly cookies: tokens, in any form.

---

## 7. Where logic does NOT go

- **No axios outside `frontend/src/lib/api/`.** Components and pages call services or stores.
- **No global state outside `frontend/src/store/`.** No Context-based auth, no module-level mutable state.
- **No business logic in `frontend/src/app/*`.** Pages compose components and call stores.
- **No CSS files except `globals.css`.** Tailwind classes only.
- **No `<img>`.** Use `next/image`. For arbitrary admin-supplied URLs, add `unoptimized`.
- **No `any` in TypeScript.** Use `unknown` and narrow.
- **No comments restating what code does.** WHY-only, only when non-obvious.
- **No mongoose models imported into routes.** Go through the controller.
- **No `accessCookieOptions`.** Access tokens are not cookies in this codebase.
- **No raw `req.body` straight to `Model.create({ ...req.body })`.** Whitelist fields explicitly. Schemas use `strict: true` as a backstop.
- **No `$regex` from raw `req.query`.** Apply `escapeRegex(...)` and clamp the input length first.

---

## 8. State decisions cheat-sheet

| You need to track…                | Use this                                            |
|-----------------------------------|------------------------------------------------------|
| Logged-in user / role             | `auth.store` (in-memory)                             |
| Access token                      | `auth.store.accessToken` (in-memory)                 |
| Maintenance settings              | `MaintenanceGate` local state (mount + 60 s poll)    |
| Form fields                       | `react-hook-form`                                    |
| Modal open/close on one page      | `useState` (local)                                   |
| List of packages / bookings / messages | Component-level fetch (no store)                |
| Filter / sort / pagination state  | Component-level `useState` + `useMemo` for derived data |
| Multi-step UI (e.g. password OTP) | Component-level state machine (`stage: …`)           |
| Image slider active index         | Local `useState` inside the slider component         |

---

## 9. Currency & dates

- **Prices in NPR**. Format with `formatNPR(value)` from `lib/utils.ts` (`Intl.NumberFormat("en-IN", { style: "currency", currency: "NPR", maximumFractionDigits: 0 })`).
- **Booking dates**: `<input type="date">` with `min={todayISO}`. Server also rejects past dates. ISO date strings (`YYYY-MM-DD`) flow into Booking documents (Mongoose stores as `Date`).
- **Pricing math (children at 50 %)**: `total = adults × priceNPR + children × Math.round(priceNPR / 2)`. Always recompute server-side before persisting.

---

## 10. Definition of done (per task)

A task is done only when **all** of these are true:
1. ✅ Feature works end-to-end in the browser at `http://localhost:3000` (manual click-through).
2. ✅ `cd frontend && npx tsc --noEmit` reports zero errors.
3. ✅ `cd backend && node -e "process.env.JWT_ACCESS_SECRET='x'; process.env.JWT_REFRESH_SECRET='y'; process.env.MONGO_URI='mongodb://x'; process.env.CLIENT_URL='http://localhost:3000'; require('./src/app');"` loads cleanly.
4. ✅ Mobile (375 px) layout doesn't break — no horizontal scroll, all CTAs reachable.
5. ✅ Any new page exports `metadata` (title + description).
6. ✅ Any new image host is in `next.config.ts` `remotePatterns` *or* the image is rendered `unoptimized`.
7. ✅ Any new env var is added to **both** the live `.env` and the corresponding `.env.example`.
8. ✅ Any new admin endpoint is rate-limited if it accepts un-bounded user input.
9. ✅ Any new search/filter that uses `$regex` escapes the input via `escapeRegex` and clamps length.

---

## 11. Pointers to source-of-truth files

| Question                                       | Where                                                  |
|------------------------------------------------|--------------------------------------------------------|
| "Why did we pick X?"                           | `ARCHITECTURE.md` §2                                   |
| "What's the API contract?"                     | `ARCHITECTURE.md` §6                                   |
| "What does a `Booking` / `ContactMessage` look like?" | `frontend/src/types/index.ts` & `backend/src/models/` |
| "Where do brand colors live?"                  | `frontend/src/app/globals.css` (`@theme inline`)       |
| "Which images can I use?"                      | `frontend/next.config.ts` → `images.remotePatterns`    |
| "How does auth work?"                          | `ARCHITECTURE.md` §11 + this file §6                   |
| "Email verification flow?"                     | `ARCHITECTURE.md` §12                                  |
| "Password change OTP flow?"                    | `ARCHITECTURE.md` §17                                  |
| "Booking flow?"                                | `ARCHITECTURE.md` §16                                  |
| "Admin panel scope / role gating?"             | `ARCHITECTURE.md` §13                                  |
| "Maintenance mode behaviour?"                  | `ARCHITECTURE.md` §15 (gate exempts `/admin/*` + `/login`) |
| "Caching / ISR / lazy loading?"                | `ARCHITECTURE.md` §19                                  |
| "Rate limits / helmet / body limits?"          | `ARCHITECTURE.md` §20                                  |
| "How do I add a route / component / store / mailer?" | This file §5                                     |

---

## 12. When in doubt

1. Re-read `ARCHITECTURE.md`.
2. Search the repo for a similar pattern and copy its shape:
   - Wired admin table → `users/UsersClient.tsx` or `bookings/BookingsClient.tsx`
   - Multi-section form → `BookingClient.tsx`
   - Modal CRUD form → `PackageFormDialog.tsx` (lazy-loaded via `next/dynamic`)
   - Detail dialog with thread + reply → `MessageDetailDialog.tsx`
   - 2-step state machine (form → verify → done) → `ChangePasswordForm.tsx`
   - Server-fetched + client-filtered list → `app/destinations/page.tsx` + `DestinationsClient.tsx`
   - Standalone client gate → `MaintenanceGate.tsx`
   - One-off Mongo script → `backend/src/scripts/seedPackages.js`
3. Run `npx tsc --noEmit` (frontend) or the backend smoke-load early and often.
4. If still unclear, ask the user before inventing a new convention.

---

## 13. Known caveats

- **Inner git repo trap:** `create-next-app` initialises `frontend/.git`. If you re-bootstrap the frontend, **delete `frontend/.git` immediately** so the parent repo can track files normally — otherwise GitHub will see only an empty submodule pointer.
- **Lucide brand icons removed:** `Facebook`, `Twitter`, `Instagram`, `Youtube`, `Linkedin` no longer ship with `lucide-react`. Use `frontend/src/components/layout/SocialIcons.tsx` (inline SVGs).
- **Tailwind 4 has no `tailwind.config.ts`:** theme tokens go in `globals.css` under `@theme inline`.
- **`MONGO_URI` in `.env` is space-sensitive:** `MONGO_URI=...` (no space before `=`); dotenv does trim, but lint your env on edit.
- **Gmail SMTP requires App Password**, not the normal Google login. 2FA must be enabled first; generate at <https://myaccount.google.com/apppasswords>.
- **Admin-supplied gallery URLs** must be rendered with `<Image … unoptimized>`. Without it, Next throws `Invalid src prop … hostname not configured under images`.
- **Brand-search image proxies expire** (e.g. `imgs.search.brave.com/…`). Prefer Unsplash, Pexels, Picsum, or your own CDN.
- **`useFieldArray` on primitive arrays** (e.g. `string[]`) is awkward in react-hook-form 7 — for the package gallery we manage URLs with plain `useState` and validate at submit time. See `PackageFormDialog.tsx`.
- **`Suspense` around `useSearchParams`**: any client component that reads `useSearchParams` must be wrapped in `<Suspense>` from a server-component parent (e.g. `app/booking/page.tsx` does this for `BookingClient`).
- **Maintenance mode is enforced server-side too.** Don't only rely on `MaintenanceGate.tsx` — `middleware/maintenanceCheck.js` returns `503` to non-admin requests on non-exempt paths. Adding a new public endpoint that should stay live during maintenance? Add its prefix to `EXEMPT_PREFIXES`.
- **Password-change OTP is single-shot.** A wrong code invalidates the OTP — the user must request a new one. This is intentional (defense vs brute force on a 6-digit space). Communicate this in any UI you build around it.
- **Dashboard cache is in-memory** — busted on booking writes only. If you add another booking-modifying admin action, call `bustDashboardCache()` (defined in `admin.controller.js`) at the end of the controller.
- **ISR keys are default**: changes from `/admin/packages` won't appear on `/destinations` until 5 min pass (or you trigger an on-demand revalidate). Explicitly call `revalidatePath('/destinations')` from the admin controller if you need instant freshness — currently we don't, so admins should be aware of the lag.
- **Rate limiters use IP**: behind a proxy/CDN you must trust the right header. `app.set('trust proxy', 1)` is set; if you ever deploy behind multiple proxies, bump to the actual hop count or pass a function.
- **The seed script (`seedPackages.js`) is idempotent.** Re-running updates existing packages by slug — including their gallery seeds and category — so changes to the script propagate on next run.
- **`error.code` is hidden in production.** Don't rely on it client-side for production-only branches; use server-provided string `error` instead, or expose specific `code` values intentionally (we keep `EMAIL_NOT_VERIFIED`, `VERIFY_EXPIRED`, `OTP_EXPIRED`, `MAINTENANCE`).
