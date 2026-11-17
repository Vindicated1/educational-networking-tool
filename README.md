# University of Ibadan Educational Networking Tool

## Run locally

Use Node.js 20 or later:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase environment variables, local development uses SQLite at `data/education-network.db`.

Demo sign-in:

| Role | Email | Password |
| --- | --- | --- |
| Student | `20234567@stu.ui.edu.ng` | `password123` |
| Admin | `admin@ui.edu.ng` | `admin123` |

These demo credentials are for local SQLite development only. When using Supabase, register an account with `@stu.ui.edu.ng` or `@dlc.ui.edu.ng`; faculty accounts use `@ui.edu.ng`. Faculty registration assigns the faculty role based on the email domain; it does not independently verify identity.

## Working features

- Password-hashed registration and login with an HTTP-only session cookie.
- SQLite persistence for local development and Supabase Postgres persistence in deployment.
- PDF/DOCX uploads up to 10 MB. Local files are stored under `data/uploads`; deployed files use a private Supabase Storage bucket.
- Faculty/admin-only answer verification and moderation access.

The interface uses the University of Ibadan logo published on the official [ui.edu.ng](https://ui.edu.ng) website.

## Supabase and Vercel setup

1. In the Supabase SQL Editor, run [`supabase/migrations/20261117000100_initial_schema.sql`](./supabase/migrations/20261117000100_initial_schema.sql). It creates the application tables, sample content, and private resource-storage bucket.
2. In Vercel project settings, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` for Production (and Preview if needed). Get the URL and service-role key from Supabase project settings. Generate `JWT_SECRET` with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` and `JWT_SECRET` server-only: do not use `NEXT_PUBLIC_` prefixes or commit real values.
4. Redeploy after adding the variables. Supabase is selected automatically on Vercel; local runs without Supabase variables continue to use SQLite.

The local SQLite database and upload files are excluded from Git and do not transfer to Vercel. Accounts created in the local database are separate from Supabase accounts.

## Validation

```powershell
npm run lint
npm run build
```
