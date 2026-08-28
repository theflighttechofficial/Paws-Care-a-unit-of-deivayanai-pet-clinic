# Paws & Care

> A full-stack veterinary clinic platform for pet owners, doctors, and clinic administrators.

Paws & Care brings pet profiles, appointment booking, medical records, and clinic operations into one focused workspace. Pet owners can manage their animals and appointments, doctors can document visits, and administrators can oversee clinic activity and connect Google Calendar for event and Meet-link creation.

## What It Includes

### Pet owners

- Create an account, sign in, and restore sessions with JWT authentication.
- Recover and reset a forgotten password.
- Create, update, view, and delete pet profiles.
- Store species, breed, gender, date of birth, weight, color, microchip ID, notes, and profile images.
- Book general consultations, vaccinations, dental care, and follow-up visits.
- Choose a doctor, consultation type, date, and available time slot.
- View, cancel, and open appointments in Google Calendar when the integration is connected.
- Review medical records belonging to their pets.

### Doctors

- View assigned appointments.
- Open a patient visit and review pet history.
- Record symptoms, vitals, clinical notes, diagnosis, treatment, and prescriptions.
- Save or complete a medical record for an appointment.

### Administrators

- View clinic-wide counts and appointment activity.
- Search and filter appointments and update their status.
- Review patients and doctors.
- View the clinic's configured services.
- Connect or disconnect the shared Google Calendar account from Settings.

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React 19, React Router, Vite, Tailwind CSS, Framer Motion, Lucide React |
| Backend | Node.js, Express 5, JWT, bcryptjs |
| Database | PostgreSQL with `pg` |
| Integrations | Google Calendar API, Google Meet conference data, Resend password-reset email |
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
	+--> Google Calendar OAuth
	+--> Resend email delivery
```

The API is mounted under `/api`. In development, Vite proxies `/api` requests to the Express server. Authorization is enforced by the API with bearer JWTs; the database itself does not use Supabase Auth or row-level security.

## Requirements

- Node.js 18 or newer
- npm
- PostgreSQL 14 or newer, with permission to create the `pgcrypto` extension
- A database connection string

Google Calendar and Resend are optional for local development. PostgreSQL and a JWT secret are required for the server to start.

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

# Optional: Google Calendar OAuth
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/google/oauth/callback
GOOGLE_CALENDAR_ID=primary
CLINIC_TIMEZONE=Asia/Kolkata

# Optional: password-reset email delivery
RESEND_API_KEY=your-resend-api-key
RESEND_FROM=Paws & Care <noreply@example.com>
```

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

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with HMR |
| `npm run server` | Start the Express API with Nodemon |
| `npm run build` | Create the production frontend bundle |
| `npm run preview` | Preview the production frontend bundle |
| `npm run lint` | Run ESLint across the project |

## Database

The schema is defined in [`server/db/schema.sql`](server/db/schema.sql) and contains:

- `profiles`: owner, doctor, and administrator identities, credentials, roles, and password-reset fields.
- `doctors`: doctor specialization, experience, biography, and availability.
- `pets`: owner-owned pet profiles and health details.
- `appointments`: doctor slots, services, consultation type, status, notes, and Google sync metadata.
- `medical_records`: visit notes, diagnosis, treatment, prescriptions, and vitals.
- `google_calendar_connection`: one shared OAuth connection for the clinic calendar.

A partial unique index prevents two non-cancelled appointments from occupying the same doctor, date, and time slot.

## API Overview

All protected requests use:

```http
Authorization: Bearer <jwt>
```

| Area | Routes |
| --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Health | `GET /api/health` |
| Pets | `GET/POST /api/pets`, `GET/PUT/DELETE /api/pets/:id` |
| Appointments | `GET /api/appointments/doctors`, `GET /api/appointments/booked-slots`, `GET /api/appointments/owner/mine`, `POST /api/appointments`, `GET /api/appointments/:id` |
| Appointment actions | `PATCH /api/appointments/:id/status`, `PATCH /api/appointments/:id/cancel`, `PATCH /api/appointments/:id/complete` |
| Doctor workflow | `GET /api/appointments/doctor/mine`, `POST /api/medical-records` |
| Administration | `GET /api/admin/stats`, `GET /api/admin/appointments`, `GET /api/admin/patients` |
| Calendar administration | `GET /api/admin/google/connect`, `GET /api/admin/google/status`, `POST /api/admin/google/disconnect` |

Role checks are applied in the route and controller layers. Owners, assigned doctors, and administrators have different appointment and medical-record permissions.

## Google Calendar and Meet

Calendar synchronization is optional and intentionally degrades gracefully. When connected, clinic and online bookings can create Google Calendar events; online bookings also request Google Meet conference data.

The implemented flow uses an administrator-authorized Google OAuth account, not a bare service account. Configure the OAuth variables above, register the redirect URI in Google Cloud, enable the Google Calendar API, then connect the account from the administrator Settings page.

More background is available in [`GOOGLE_CALENDAR_SETUP.md`](GOOGLE_CALENDAR_SETUP.md). That document contains older service-account wording in places; use the OAuth variable names and flow implemented in `server/lib/googleCalendar.js` as the source of truth.

## Development Data

The repository includes operational scripts for development and migration:

```bash
node server/scripts/seedDevelopmentData.js
node server/scripts/createSubbuDoctor.js
node server/scripts/addPasswordResetColumns.js
```

Migration and cleanup scripts are also available in [`server/scripts`](server/scripts). Review each script before running it against a shared or production database. In particular, `removeOtherDoctors.js` permanently removes doctor profiles after reassigning related data.

## Project Structure

```text
pet-clinic/
├── src/
│   ├── components/       Shared UI components
│   ├── context/          Authentication state
│   ├── lib/              API and client helpers
│   ├── pages/            Owner, doctor, and admin screens
│   ├── App.jsx           Public landing page
│   └── Router.jsx        Role-protected routes
├── server/
│   ├── config/            PostgreSQL connection
│   ├── controllers/       Request and business logic
│   ├── db/                Queries and schema
│   ├── lib/               Calendar and mail integrations
│   ├── middleware/        JWT authorization
│   ├── routes/            Express route definitions
│   └── scripts/           Seed, migration, and maintenance scripts
├── public/                Static frontend assets
├── index.html
├── vite.config.js
└── package.json
```

## Validation

Run the production build and lint checks from `pet-clinic`:

```bash
npm run build
npm run lint
```

There is currently no automated test suite or `npm test` script. The production build is the primary automated frontend check, while end-to-end verification requires a reachable PostgreSQL database and configured local environment.

## Current Scope

- Phone consultation currently routes to contact information instead of creating a slot-based appointment.
- Services and doctor management are currently represented by frontend/admin views rather than full service and doctor CRUD APIs.
- Google Calendar requires an OAuth connection before events can be synchronized.
- Password reset falls back to logging a reset URL when Resend is unavailable; use a real mail provider in production.
- The default CORS and Vite proxy configuration targets local development URLs.

## Security Notes

- Keep `.env` files and Google credential material out of Git. The repository root `.gitignore` excludes local secrets, dependency folders, logs, and build output.
- Use a strong, unique `JWT_SECRET` in every environment.
- Protect the PostgreSQL database because it stores password hashes, reset-token hashes, OAuth tokens, and clinic records.
- Review and tighten CORS, token handling, logging, and email configuration before production deployment.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
