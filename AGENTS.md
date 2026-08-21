# AGENTS.md — Society Maintenance Tracker

## Project
Full-stack complaint tracking app for apartment societies. Residents raise complaints with photos; admin manages status/priority through a lifecycle; notice board + email notifications; admin dashboard.

## Stack (do not substitute without asking)
- Frontend: React (Vite) + TailwindCSS, deployed as static build on Vercel.
- Backend: FastAPI (run locally via `uvicorn main:app --reload`), deployed as a Vercel Python Function (`@vercel/python`). Entry point: `backend/main.py`, must expose an ASGI `app` instance.
- Database: Postgres on Neon (serverless, free tier). Use SQLAlchemy + Alembic for models/migrations. Connection via `DATABASE_URL` env var, pooled connection string.
- Auth: JWT (python-jose) + bcrypt password hashing. No server-side sessions (must stay stateless for serverless).
- Photo storage: Cloudinary. Frontend uploads directly to Cloudinary (signed preset); backend only ever stores the returned URL string in `complaints.photo_url`. Never write uploaded files to local disk.
- Email: Brevo REST API (`https://api.brevo.com/v3/smtp/email`) via `BREVO_API_KEY`. Fire-and-forget with try/except logging — never let email failures block a DB transaction.
- Scheduled jobs: Vercel Cron hitting a `/cron/overdue-check` route. No Celery, no Redis, no background workers.

## Hard constraints
- Single Vercel project/repo. `vercel.json` at root routes `/api/**` to `backend/main.py` and everything else to `frontend/dist`.
- No self-hosted databases, no Docker-in-prod, no local file storage — Vercel Functions have an ephemeral, read-only filesystem.
- Keep Postgres schema exactly as defined in `schema.sql` at repo root unless a phase explicitly asks for a change; ask before altering it.
- Every complaint status change must INSERT a new row into `complaint_status_history` — never overwrite/delete history rows.
- Once a complaint's status is `RESOLVED`, reject further status-change requests at the API layer (409).
- Overdue = computed live in the admin list query using `settings.overdue_threshold_days`, not a manually toggled field.

## Conventions
- Python: type hints everywhere, Pydantic v2 schemas separate from SQLAlchemy models.
- API prefix: all backend routes under `/api/`.
- React: functional components + hooks, axios client in `src/api/client.js` reading `VITE_API_URL`.
- Env vars: never hardcode secrets; always read from `os.environ` / `import.meta.env` and keep `.env.example` in sync.

## Workflow expectations
- Before implementing any phase, propose a short plan (files to touch, dependencies to add, logic overrides) and wait for approval.
- After implementing, run the relevant test/lint command and report the output before moving to the next phase.
- If a requirement conflicts with a hard constraint above, stop and ask rather than silently deviating.
