# Society Maintenance Tracker

A modern, full-stack complaint tracking and society management web application built for apartment residential complexes. Residents can raise issues with attached photos, track real-time status transitions, receive email notifications, and view notice board announcements. Administrators manage complaint lifecycles, assign priorities, broadcast important notices, adjust overdue thresholds, and monitor society SLA health.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router v6
- **Backend**: Python 3.11, FastAPI (ASGI), SQLAlchemy 2.0 (ORM), Pydantic v2
- **Database**: PostgreSQL (Serverless on Neon) with Alembic database migrations
- **Photo Storage**: Cloudinary (Direct secure delivery URLs with strict server-side HTTPS validation)
- **Transactional Email**: Brevo REST API (Asynchronous, non-blocking notification delivery)
- **Deployment Platform**: Vercel (Static frontend build + `@vercel/python` Serverless Function backend)

---

## Repository Structure

```text
├── .env.example              # Environment variables template
├── vercel.json               # Vercel monorepo build, function runtime & routing config
├── package.json              # Monorepo root scripts
├── requirements.txt          # Root Python dependencies for Vercel build
├── schema.sql                # PostgreSQL reference schema
├── scripts/
│   └── smoke_test.py         # Deployment smoke-test script
├── backend/
│   ├── main.py               # Vercel ASGI entrypoint
│   ├── alembic.ini           # Alembic migration configuration
│   ├── requirements.txt      # Backend Python dependencies
│   ├── alembic/              # Database migration versions
│   ├── app/
│   │   ├── main.py           # FastAPI application definition & CORS
│   │   ├── core/             # Config, DB, Security, Cloudinary, Email, Dependencies
│   │   ├── models/           # SQLAlchemy models (User, Complaint, Notice, Setting)
│   │   ├── schemas/          # Pydantic v2 validation models
│   │   ├── routers/          # API endpoint route handlers
│   │   └── scripts/          # Database seeding script (seed.py)
│   └── tests/                # Pytest unit, contract, and regression test suite
└── frontend/
    ├── package.json          # Frontend dependencies & scripts
    ├── vite.config.js        # Vite build & local API proxy configuration
    ├── src/
    │   ├── api/              # Axios API client modules
    │   ├── components/       # Common, Complaint, and Notice components
    │   ├── context/          # React AuthContext (JWT state management)
    │   ├── pages/            # Application views (Dashboard, Complaints, Notices, Admin)
    │   └── test/             # Vitest component & router unit tests
```

---

## Local Development Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL database (or Neon serverless instance)

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your database and service credentials:
```bash
cp .env.example .env
```

### 3. Backend Setup
```bash
# Create and activate Python virtual environment
python -m venv backend/venv
# Windows:
backend\venv\Scripts\activate
# Linux/macOS:
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run Alembic migrations against PostgreSQL
alembic -c backend/alembic.ini upgrade head

# Seed initial admin and resident accounts (idempotent)
python backend/app/scripts/seed.py

# Start FastAPI development server
uvicorn backend.app.main:app --reload --port 8000
```

### 4. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

Default seeded credentials:
- **Admin**: `admin@society.com` / `Admin@12345`
- **Resident**: `resident@society.com` / `Resident@12345`

---

## Running Test Suites

### Backend Tests (Pytest)
```bash
pytest backend/tests
```

### Opt-in Real Service Tests
To test live Neon database connectivity, real Cloudinary uploads, or live Brevo email delivery:
```bash
# Enable real-service integration tests:
export RUN_REAL_SERVICE_TESTS=true
# Optionally enable real email dispatch:
export RUN_REAL_EMAIL_TESTS=true

pytest backend/tests/test_integration_real.py
```

### Frontend Tests (Vitest)
```bash
cd frontend
npm test
```

### Frontend Production Build Verification
```bash
cd frontend
npm run build
```

---

## Vercel Deployment Guide

### Architecture on Vercel
- **Frontend**: Static single-page application built via `npm run build` and output to `frontend/dist`.
- **Backend**: FastAPI serverless function powered by `@vercel/python` mapped to `backend/main.py`.
- **API Routing**: `/api/(.*)` requests route directly to the FastAPI ASGI app.
- **SPA Routing**: Non-API paths (`/((?!api/).*)`) route to `/index.html` ensuring direct browser refreshes on `/dashboard`, `/complaints/:id`, and `/admin/dashboard` resolve seamlessly without 404s.

### Environment Variables Checklist (Vercel Project Settings)

Configure the following under **Project Settings > Environment Variables**:

| Variable | Target | Type | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Production & Preview | Backend Secret | Neon PostgreSQL pooled URL (`postgresql://...?sslmode=require`) |
| `JWT_SECRET_KEY` | Production & Preview | Backend Secret | Random 256-bit secret string for token signing |
| `JWT_ALGORITHM` | Production & Preview | Backend Plain | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Production & Preview | Backend Plain | `1440` |
| `CLOUDINARY_CLOUD_NAME` | Production & Preview | Backend Plain | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | Production & Preview | Backend Plain | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Production & Preview | Backend Secret | Cloudinary API secret |
| `BREVO_API_KEY` | Production & Preview | Backend Secret | Brevo REST API key |
| `EMAIL_FROM` | Production & Preview | Backend Plain | Configured sender email address |
| `EMAIL_FROM_NAME` | Production & Preview | Backend Plain | Sender display name |
| `FRONTEND_URL` | Production & Preview | Backend Plain | Deployed production URL (e.g. `https://your-society.vercel.app`) |
| `ENVIRONMENT` | Production | Backend Plain | `production` |
| `CORS_ORIGINS` | Production & Preview | Backend Plain | Explicit origins (e.g. `https://your-society.vercel.app`) |
| `VITE_API_URL` | Production & Preview | Frontend Build | `/api` |

> **Security Note**: Never expose `DATABASE_URL`, `JWT_SECRET_KEY`, `CLOUDINARY_API_SECRET`, or `BREVO_API_KEY` with the `VITE_` prefix.

### Pre-Deployment Migration Steps
Because serverless functions run on ephemeral, read-only filesystems, execute migrations and database seeding **before** deploying to production:
```bash
# 1. Apply latest Alembic migrations to Neon DB
alembic -c backend/alembic.ini upgrade head

# 2. Run idempotent database seeder
python backend/app/scripts/seed.py
```

---

## Live SLA & Overdue Resolution

Complaint overdue status is computed **live** in queries against the configurable threshold stored in the `settings` table (`settings.overdue_threshold_days`, default: 3 days):
$$	ext{is\_overdue} = (	ext{status} 
eq 	ext{RESOLVED}) \land (	ext{now}() - 	ext{created\_at} > 	ext{threshold\_days})$$
No Celery, Redis, background cron workers, or scheduled daemons are required.

---

## Deployment Smoke-Testing

Run the included smoke test script to verify endpoint functionality against your local or deployed environment:

```bash
# Smoke test local server:
python scripts/smoke_test.py

# Smoke test deployed Vercel application:
BASE_URL="https://your-society.vercel.app" python scripts/smoke_test.py

# Optionally register a new test user during smoke test:
BASE_URL="https://your-society.vercel.app" SMOKE_CREATE_USER=true python scripts/smoke_test.py
```
