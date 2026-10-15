# Capital University Registration Portal

An Arabic-first, bilingual (Arabic RTL / English LTR) registration site and protected admin dashboard for **Capital University / جامعة العاصمة**. It is built with the Next.js App Router, Tailwind CSS, Drizzle ORM, and PostgreSQL. Visitor submissions are stored centrally in PostgreSQL; there is no browser-local or in-memory submission storage.

## What is included

- Responsive registration form with live field status dots and shared Zod validation on the client and server.
- Egyptian mobile and national-ID validation, including Arabic-Indic digit conversion, valid ID birth-date/governorate checks, and DOB cross-checking.
- Unique national ID constraint in PostgreSQL to prevent duplicate submissions, even when requests arrive concurrently.
- Admin sign-in at `/admin`, verified only on the server; signed, `httpOnly`, `SameSite=Lax` session cookie expires after four hours.
- PostgreSQL-backed login throttling (five incorrect attempts per IP in a 15-minute window; the raw IP is not stored).
- New/old request tabs, search, pagination, copy-all and per-field clipboard actions, automatic archiving after copy, return-to-new, and confirmed deletion.
- Arabic-first interface with a language toggle, Cairo font bundled locally, reduced-motion support, accessible labels/focus states, and a branded animated loading screen.
- A Drizzle SQL migration and Vercel deployment instructions below.

## Requirements

- Node.js **20.19 or newer** (Node 22 LTS is recommended).
- npm.
- A PostgreSQL database. Neon, Supabase, or a compatible hosted PostgreSQL provider works. Use the provider's SSL-enabled / pooled connection string for Vercel.

## Local setup

1. Install packages:

   ```bash
   npm install
   ```

2. Create local environment configuration:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and set `DATABASE_URL` to your PostgreSQL connection string. For local development, set a private `ADMIN_PASSWORD`. Generate a session-signing secret, for example:

   ```bash
   openssl rand -base64 32
   ```

   Put the result in `ADMIN_SESSION_SECRET`. It must be at least 32 characters in production.

3. Create the database tables and enums by applying the checked-in Drizzle migration:

   ```bash
   npm run db:migrate
   ```

   The initial migration is `drizzle/0000_steep_rhino.sql`. It creates `registration_requests`, the unique national-ID index, and the persistent `admin_login_attempts` rate-limit table. It is safe to apply once to an empty database; Drizzle tracks applied migrations in `__drizzle_migrations`.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`. The admin sign-in is at `http://localhost:3000/admin`.

5. Optional quality checks:

   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL URL used by the app and Drizzle migrations. Use an SSL-enabled pooled URL in serverless production. |
| `ADMIN_PASSWORD` | Yes for deployment | Admin password checked by the login API. For compatibility with the requested default, the server falls back to `2030` when this variable is absent. **Set a private password before deploying.** |
| `ADMIN_SESSION_SECRET` | Yes in production | Random secret used to sign admin sessions and pseudonymize IPs for rate limiting. Use at least 32 random characters; never commit it. |

There are no `NEXT_PUBLIC_*` secrets. Database credentials, the admin password, and the session key stay on the server.

## Database and migration commands

```bash
npm run db:generate  # generate a migration after editing db/schema.ts
npm run db:migrate   # apply checked-in migrations
npm run db:push      # prototype/local schema sync (prefer migrations for shared environments)
npm run db:studio    # open Drizzle Studio
```

`drizzle.config.ts` reads `.env.local` (then `.env`) for local migration commands. For production, point `DATABASE_URL` at the production database in a secure shell or migration job and run `npm run db:migrate` **before** sending traffic to code that expects the new schema. Avoid running schema pushes against production.

## API routes

- `POST /api/submit` — validates every field again on the server and inserts a request. Responds with `409 DUPLICATE_NATIONAL_ID` for a repeated national ID.
- `POST /api/admin/login` — checks `ADMIN_PASSWORD` on the server, rate-limits failures in PostgreSQL, and sets the signed `httpOnly` session cookie.
- `POST /api/admin/logout` — clears the admin session cookie.
- `GET /api/admin/requests?status=new|old&q=...&page=1` — session-protected list, counts, search, and pagination.
- `PATCH /api/admin/requests/:id` — session-protected status update (`new` or `old`).
- `DELETE /api/admin/requests/:id` — session-protected permanent deletion.

The API routes run in the Node.js runtime because they use PostgreSQL and Node cryptography. All admin read/update/delete routes verify the signed cookie on the server; the password is never sent to or embedded in dashboard code.

## Deploy to Vercel

1. **Create PostgreSQL.** Create a Neon or Supabase database and copy its SSL-enabled pooled connection string. Keep the database in a region close to the Vercel project when possible.
2. **Create production secrets.** Generate a unique value with `openssl rand -base64 32`. Choose a strong `ADMIN_PASSWORD` (do not use `2030`).
3. **Add Vercel environment variables.** In **Project → Settings → Environment Variables**, add `DATABASE_URL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` for Production. Add separate values for Preview if previews should use an isolated database and credentials. Do not expose these values with a `NEXT_PUBLIC_` prefix.
4. **Apply the migration before the first live deployment.** From a secure local shell or release job, set `DATABASE_URL` to the production connection string and run:

   ```bash
   npm ci
   npm run db:migrate
   ```

   Alternatively, with the Vercel CLI linked to this project, pull the Production variables into the ignored local env file that Drizzle reads, then migrate:

   ```bash
   npx vercel env pull .env.local --environment=production
   npm run db:migrate
   ```

   Do not commit `.env.local`; it contains production secrets. Applying migrations as a one-time release step avoids running schema mutations concurrently in every Vercel build.
5. **Import the repository into Vercel.** Select this GitHub repository and the active branch. Vercel detects Next.js automatically; use `npm run build` as the build command and leave the output directory on its default. Node 20.19+ is required.
6. **Deploy and verify.** Open the deployment URL, submit a test registration, and sign in at `/admin`. The first password is whatever you configured in `ADMIN_PASSWORD`; `2030` is only the code's fallback when the variable is omitted, and must not be used for a public deployment.
7. **Keep the schema current.** For later schema changes, commit the generated SQL migration and apply it once to the target database before promoting the matching application release.

Vercel deployments are serverless, so the application uses a single-connection PostgreSQL client per instance with prepared statements disabled for pooler compatibility. The database, not an instance's memory, is the source of truth for all registrations and login rate limits.

## Project map

```text
app/
  api/                    # submission and protected admin route handlers
  admin/page.tsx          # admin dashboard route
  globals.css             # responsive visual system and animation
  layout.tsx              # metadata, Cairo font, language provider, global footer
components/               # registration, admin, reusable fields, dots, copy, loading, footer
db/schema.ts               # Drizzle PostgreSQL schema
drizzle/                   # SQL migration and Drizzle journal/snapshot
lib/                       # database, auth, i18n, HTTP and shared validation helpers
```
