# University of Ibadan Educational Networking Tool

## Run locally

Use Node.js 20 or later:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first server request creates a SQLite database at `data/education-network.db` and seeds demo records.

Demo sign-in:

| Role | Email | Password |
| --- | --- | --- |
| Student | `20234567@stu.ui.edu.ng` | `password123` |
| Admin | `admin@ui.edu.ng` | `admin123` |

Use these credentials only for local demonstrations. New student accounts can be registered with `@stu.ui.edu.ng` or `@dlc.ui.edu.ng`; faculty accounts use `@ui.edu.ng`. Faculty registration assigns the faculty role based on the email domain; it does not independently verify identity.

## Working features

- Password-hashed registration and login with an HTTP-only session cookie.
- SQLite persistence for users, forum threads, replies, votes, resources, project interests, and moderation decisions.
- Resource upload of PDF/DOCX files up to 10 MB. Files are stored under `data/uploads` and are downloadable from the resource library.
- Faculty/admin-only answer verification and moderation access.

The interface uses the University of Ibadan logo published on the official [ui.edu.ng](https://ui.edu.ng) website.

The SQLite database and uploaded files are local persistent storage intended for development and single-instance demonstrations. For production or multiple application instances, replace them with a managed database and shared object storage. Configure a strong `JWT_SECRET` in `.env.local` before running in production; production authentication fails closed if it is missing.

## Validation

```powershell
npm run lint
npm run build
```
