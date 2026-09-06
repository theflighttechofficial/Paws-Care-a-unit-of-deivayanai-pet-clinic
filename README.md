# 🐾 Paws & Care

> **Important:** Do not pull or clone this repository without authorization from the project owner.

A full-stack veterinary clinic platform for pet owners, doctors, and clinic administrators — appointment booking with payment-gated slots, pet health records, Google Calendar/Meet integration, and Razorpay payments, all in one workspace.

Built end-to-end by **S. Varun Vaibhav** ([The Flight Tech Labs](https://github.com/theflighttechofficial)) — see the in-app "About the Developer" page (`/about-developer`) for the full writeup.

---

## Table of Contents

- [What It Includes](#what-it-includes)
- [Technology](#technology)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Database](#database)
- [API Overview](#api-overview)
- [Payments (Razorpay)](#payments-razorpay)
- [Google Calendar & Meet](#google-calendar--meet)
- [Email (Resend)](#email-resend)
- [Deployment (Firebase App Hosting)](#deployment-firebase-app-hosting)
- [Development Data & Scripts](#development-data--scripts)
- [Project Structure](#project-structure)
- [Validation](#validation)
- [Current Scope](#current-scope)
- [Security Notes](#security-notes)

---

## What It Includes

### Pet owners

- Register, sign in, and restore sessions with JWT authentication — or sign in / sign up with Google (one flow handles both: a first-time Google sign-in auto-creates the account).
- Recover and reset a forgotten password.
- Create, update, view, and delete pet profiles (species, breed, gender, date of birth, weight, color, microchip ID, notes, profile image).
- Book clinic visits, online (Google Meet) consultations, or phone consultations across general consultations, vaccinations, dental care, and follow-up visits.
- Choose a doctor, date, and a 30-minute time slot; slots already booked or during a doctor's leave are disabled automatically.
- **Slots are reserved only after payment succeeds** — a clinic or online booking creates a pending Razorpay order first; the appointment (and its Google Calendar event + confirmation emails) is only created once the payment signature is verified server-side. An abandoned/failed payment never holds a slot.
- View, cancel, and open appointments in Google Calendar when the integration is connected.
- Rate a completed appointment and leave feedback.
- Review medical records belonging to their pets.
- A one-time onboarding walkthrough (sign in → add a pet → book → pay) shown once per account on first dashboard visit.

### Doctors

- View assigned appointments and manage their own leave calendar.
- Open a patient visit and review pet history.
- Record symptoms, vitals, clinical notes, diagnosis, treatment, and prescriptions.
- Save or complete a medical record for an appointment.

### Administrators

- View clinic-wide stats and appointment activity; search, filter, and update appointment status.
- Review patients, doctors, and feedback/ratings.
- Manage the clinic's service catalog.
- Record manual (cash/card/UPI) payments against an appointment.
- **Set the consultation fee** charged at booking time (Settings → Payments) — takes effect immediately for new bookings.
- Manage doctor leave days.
- Connect or disconnect the shared Google Calendar account.

### Reliability & error handling

- A global React error boundary and a combined 404 / "under maintenance" page (with a Lottie animation) so a crash never shows a blank white screen.
- Every error banner across the app includes a one-click "email admin" link (prefilled with the error + page URL).
- The Razorpay payment step warns users to disable ad blockers, which are the most common cause of the checkout script failing to load.

---

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React 19, React Router 7, Vite, Tailwind CSS 4, Framer Motion, Lucide React |
| Backend | Node.js, Express 5, JWT, bcryptjs |
| Database | PostgreSQL with `pg` |
| Payments | Razorpay (Standard Checkout, order creation + HMAC-SHA256 signature verification) |
| Integrations | Google Calendar API + Meet conference data, Google Identity Services (Sign in with Google), Resend (transactional email) |
| Hosting | Firebase App Hosting (`apphosting.yaml`) |
| Language | JavaScript with ES modules |

## Architecture

```text
React/Vite client (:5173)
	|
	| /api proxy
	v
Express API (:5000)
	|
	+--> PostgreSQL
	+--> Razorpay (orders + signature verification)
	+--> Google Calendar OAuth + Meet
	+--> Resend email delivery
```

The API is mounted under `/api`. In development, Vite proxies `/api` requests to the Express server. Authorization is enforced by the API with bearer JWTs; the database itself does not use Supabase Auth or row-level security.

## Requirements

- Node.js 22 (see `engines` in `package.json`)
- npm
- PostgreSQL 14 or newer, with permission to create the `pgcrypto` extension
- A database connection string
- A Razorpay account (test or live keys) if you want to exercise the booking flow — bookings cannot reserve a slot without a working payment step
- Google Calendar, Google Sign-In, and Resend are optional for local development; PostgreSQL, `JWT_SECRET`, and Razorpay keys are required for the full booking flow to work

## Getting Started

From the `pet-clinic` directory:

```bash
npm install
```

Create a `.env` file in `pet-clinic`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/paws_care
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:5173
VITE_API_URL=/api

# Required for the booking flow (test or live Razorpay keys)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Optional: Google Calendar OAuth (clinic-wide calendar sync + Meet links)
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/google/oauth/callback
GOOGLE_CALENDAR_ID=primary
CLINIC_TIMEZONE=Asia/Kolkata

# Optional: separate OAuth client for the "Sign in with Google" button
GOOGLE_SIGNIN_CLIENT_ID=your-google-signin-client-id
VITE_GOOGLE_CLIENT_ID=your-google-signin-client-id

# Optional: transactional email delivery
RESEND_API_KEY=your-resend-api-key
RESEND_FROM=Paws & Care <noreply@example.com>
```

> `RESEND_API_KEY`/`RESEND_FROM` must **both** be set for any email to send — there is no fallback to Resend's shared sandbox address. If either is missing, email sends fail loudly (logged, not silently swallowed) rather than emailing from an unrelated sandbox sender.

Initialize the database:

```bash
psql "$DATABASE_URL" -f server/db/schema.sql
```

Start the backend and frontend in separate terminals:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API health endpoint is available at [http://localhost:5000/api/health](http://localhost:5000/api/health).

> **Note:** `npm run server` uses nodemon and auto-restarts on `.js`/`.json` changes, but **not** on `.env` changes — restart it manually after editing `.env`.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with HMR |
| `npm run server` | Start the Express API with Nodemon (auto-restarts on code changes) |
| `npm start` | Start the Express API directly with Node (production-style, no auto-restart) |
| `npm run build` | Create the production frontend bundle |
| `npm run preview` | Preview the production frontend bundle |
| `npm run lint` | Run ESLint across the project |

## Database

The schema is defined in [`server/db/schema.sql`](server/db/schema.sql) and contains:

- `profiles` — owner, doctor, and administrator identities, credentials, roles, and password-reset fields.
- `doctors` — specialization, experience, biography, and availability.
- `pets` — owner-owned pet profiles and health details.
- `appointments` — doctor slots, services, consultation type, status, notes, and Google sync metadata.
- `payments` — Razorpay order/payment records, linked to an appointment once booked; carries a `booking_details` JSON payload for slot-purpose payments so the appointment can be created *after* payment succeeds.
- `appointment_ratings` — post-visit ratings and feedback.
- `doctor_leaves` — per-doctor leave days.
- `medical_records` — visit notes, diagnosis, treatment, prescriptions, and vitals.
- `google_calendar_connection` — one shared OAuth connection for the clinic calendar.
- `app_settings` — singleton row holding the admin-configurable consultation fee.

A partial unique index prevents two non-cancelled appointments from occupying the same doctor, date, and time slot.

## API Overview

All protected requests use:

```http
Authorization: Bearer <jwt>
```

| Area | Routes |
| --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Health | `GET /api/health` |
| Public settings | `GET /api/settings` (current consultation fee), `GET /api/services` (service catalog) |
| Pets | `GET/POST /api/pets`, `GET/PUT/DELETE /api/pets/:id` |
| Appointments | `GET /api/appointments/doctors`, `GET /api/appointments/booked-slots`, `GET /api/appointments/owner/mine`, `POST /api/appointments`, `GET /api/appointments/:id` |
| Appointment actions | `PATCH /api/appointments/:id/status`, `PATCH /api/appointments/:id/cancel`, `PATCH /api/appointments/:id/complete`, `POST /api/appointments/:id/rating` |
| Payments | `POST /api/payments/create-order`, `POST /api/payments/verify`, `GET /api/payments/mine` |
| Doctor workflow | `GET /api/appointments/doctor/mine`, `POST /api/medical-records`, doctor leave routes under `/api/leaves` |
| Administration | `GET /api/admin/stats`, `GET /api/admin/appointments`, `GET /api/admin/patients`, `GET/POST /api/admin/payments`, `GET /api/admin/ratings`, `PUT /api/admin/settings/fee` |
| Calendar administration | `GET /api/admin/google/connect`, `GET /api/admin/google/status`, `POST /api/admin/google/disconnect` |
| Service management | `POST/PUT/DELETE /api/services` (admin) |

Role checks are applied in the route and controller layers. Owners, assigned doctors, and administrators have different appointment and medical-record permissions.

## Payments (Razorpay)

The booking flow uses **Razorpay Standard Checkout**:

1. `POST /api/payments/create-order` — validates the pending booking (or an already-reserved appointment being paid for separately), creates a Razorpay order, and stores a `payments` row with the pending booking details.
2. The frontend (`PaymentGate.jsx`) opens Razorpay's checkout modal with that order.
3. On success, `POST /api/payments/verify` recomputes `HMAC-SHA256(order_id|payment_id, RAZORPAY_KEY_SECRET)` and compares it to the signature Razorpay returned. **Only on a match** does it create the appointment (`server/services/bookingService.js`), sync it to Google Calendar, and send confirmation emails.
4. If the slot was taken by someone else while checkout was open, the payment is kept as `paid` (for a manual refund) but no appointment is fabricated — the user sees a clear message to contact the clinic.

The consultation fee is fetched live from `GET /api/settings` and is fully admin-editable (Admin → Settings → Payments), stored in the `app_settings` table.

**Never commit real Razorpay keys.** `RAZORPAY_KEY_ID` is safe to expose to the frontend (it's public by design); `RAZORPAY_KEY_SECRET` must only ever live server-side, referenced via Secret Manager on Firebase App Hosting (see below).

## Google Calendar & Meet

Calendar synchronization is optional and intentionally degrades gracefully. When connected, clinic and online bookings create Google Calendar events; online bookings also request Google Meet conference data.

The implemented flow uses an administrator-authorized Google OAuth account, not a bare service account. Configure the OAuth variables above, register the redirect URI in Google Cloud, enable the Google Calendar API, then connect the account from the administrator Settings page. `GOOGLE_CALENDAR_ID` must be the actual Google account that gets connected there — not an unrelated email alias.

A separate OAuth client (`GOOGLE_SIGNIN_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID`) powers the "Sign in with Google" button via Google Identity Services — it only verifies an ID token server-side and auto-creates an owner account on first use, so it doubles as sign-up.

More background is available in [`GOOGLE_CALENDAR_SETUP.md`](GOOGLE_CALENDAR_SETUP.md). That document contains older service-account wording in places; use the OAuth variable names and flow implemented in `server/lib/googleCalendar.js` as the source of truth.

## Email (Resend)

All transactional email (password reset, booking confirmations, doctor notifications, 24-hour appointment reminders) goes through `server/lib/mailer.js`, which uses a single `RESEND_FROM` sender for every send — no fallback to Resend's shared sandbox address. Both `RESEND_API_KEY` and `RESEND_FROM` must be set, or sends fail with a clear error instead of silently using an unrelated sandbox sender.

The reminder job (`server/jobs/appointmentReminders.js`) polls every 15 minutes from an in-process interval started in `server/server.js` — there's no external cron infrastructure. Because the `FROM` sender is resolved once per process at startup, **a long-lived server process must be restarted after changing `RESEND_FROM`** for the new value to take effect.

## Deployment (Firebase App Hosting)

Configuration lives in [`apphosting.yaml`](apphosting.yaml):

- Non-secret runtime values (URLs, calendar ID, public Razorpay key ID) are set as plain `value:` entries.
- True secrets (`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_OAUTH_CLIENT_SECRET`, `RESEND_API_KEY`, `RAZORPAY_KEY_SECRET`) are referenced by name and set once via:
  ```bash
  firebase apphosting:secrets:set <NAME>
  ```
- `VITE_*` variables are baked into the frontend bundle at build time — never put a secret behind a `VITE_` prefix.

A rollout only picks up config/code changes after a fresh deploy — an already-running instance keeps its in-memory environment (and old code) until it's redeployed or restarted.

## Development Data & Scripts

The repository includes operational scripts in [`server/scripts`](server/scripts) for development and migration, e.g.:

```bash
node server/scripts/seedDevelopmentData.js
node server/scripts/createSubbuDoctor.js
node server/scripts/addPasswordResetColumns.js
```

Review each script before running it against a shared or production database. In particular, `removeOtherDoctors.js` permanently removes doctor profiles after reassigning related data.

## Project Structure

```text
pet-clinic/
├── src/
│   ├── components/       Shared UI components (PaymentGate, ErrorBoundary, OnboardingTour, ErrorNotice, ...)
│   ├── context/           Authentication state
│   ├── lib/               API client, clinic info, helpers
│   ├── pages/             Owner, doctor, and admin screens
│   ├── App.jsx            Public landing page
│   └── Router.jsx         Role-protected routes
├── server/
│   ├── config/            PostgreSQL connection + startup bootstrap
│   ├── controllers/       Request and business logic
│   ├── db/                Queries and schema
│   ├── jobs/              Appointment reminder polling job
│   ├── lib/               Calendar and mail integrations
│   ├── middleware/        JWT authorization
│   ├── routes/            Express route definitions
│   ├── services/          Shared booking logic (payment-gated slot creation)
│   └── scripts/           Seed, migration, and maintenance scripts
├── public/                Static frontend assets (incl. Lottie animations)
├── index.html
├── vite.config.js
├── apphosting.yaml
└── package.json
```

## Validation

Run the production build and lint checks from `pet-clinic`:

```bash
npm run build
npm run lint
```

There is currently no automated test suite or `npm test` script. The production build is the primary automated frontend check, while end-to-end verification requires a reachable PostgreSQL database, configured Razorpay keys, and a configured local environment.

## Current Scope

- Phone consultations route to a payment step and then contact information, rather than a slot-based appointment.
- Services and doctor management are represented by admin views plus a service CRUD API; doctor CRUD is handled via scripts rather than an admin UI.
- Google Calendar requires an OAuth connection before events can be synchronized.
- Password reset and other transactional email require `RESEND_API_KEY`/`RESEND_FROM` to be configured — there's no sandbox fallback.
- The default CORS and Vite proxy configuration targets local development URLs.

## Security Notes

- Keep `.env` files, Google credential material, and Razorpay/Resend keys out of Git. The repository root `.gitignore` excludes local secrets, dependency folders, logs, and build output.
- Use a strong, unique `JWT_SECRET` in every environment — rotating it logs out every currently-signed-in user.
- Protect the PostgreSQL database because it stores password hashes, reset-token hashes, OAuth tokens, payment records, and clinic records.
- `RAZORPAY_KEY_SECRET` must never reach frontend code or be committed — only `RAZORPAY_KEY_ID` is safe to expose publicly.
- Review and tighten CORS, token handling, logging, and email configuration before production deployment.
