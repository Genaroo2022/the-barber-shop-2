# AGENTS.md

## Project Overview

This repository is a full barbershop management system with:
- Public website and booking flow
- Admin backoffice
- React frontend (existing visual style must be preserved)
- NestJS backend (source of truth for business rules and data)
- PostgreSQL database

Primary goal of the current codebase: feature parity with the legacy `style-book-pro-main` project, but using the stack and structure of this repository.

## Tech Stack (with versions)

Frontend (`/`):
- React `18.3.1`
- Vite `5.4.19`
- TypeScript `5.8.3`
- React Router DOM `6.30.1`
- TanStack React Query `5.83.0`
- Tailwind CSS `3.4.17`
- shadcn/ui + Radix UI components
- Firebase JS SDK `12.10.0` (optional Google login flow)

Backend (`/backend`):
- NestJS `11.x` (`@nestjs/common/core/platform-express`)
- TypeORM `0.3.20`
- PostgreSQL driver `pg 8.13.1`
- JWT (`@nestjs/jwt 11.x` + `jsonwebtoken 9.0.2`)
- Validation (`class-validator 0.14.2`, `class-transformer 0.5.1`)
- bcryptjs `2.4.3`

Infra / Containers:
- Docker Compose
- PostgreSQL image `16-alpine`
- Node image `22-alpine`

## Architecture

### Frontend architecture

Key folders:
- `src/pages`: route pages (`Index`, admin pages, etc.)
- `src/components/landing`: public site sections
- `src/pages/admin`: admin sections (dashboard, appointments, clients, services, gallery, income)
- `src/lib/api.ts`: single HTTP client wrapper
- `src/lib/auth.ts`: auth token/session handling
- `src/lib/routes.ts`: configurable admin/login routes via env vars
- `src/lib/firebase.ts`: optional Firebase Google sign-in helpers
- `src/components/common/ConfirmDialog.tsx`: modal de confirmación reutilizable para acciones destructivas

Routing:
- Public root: `/`
- Admin login path and admin root are configurable:
  - `VITE_LOGIN_PATH` (default `/admin/login`)
  - `VITE_ADMIN_PATH` (default `/admin`)

Auth behavior:
- JWT is stored in `sessionStorage` (not persistent across browser close)
- Legacy `localStorage` token is cleaned automatically
- API client (`src/lib/api.ts`) tolera respuestas sin body (importante para DELETE/204)

### Backend architecture

Key folders:
- `backend/src/main.ts`: app bootstrap, CORS, validation, forced migration run before listen
- `backend/src/app.module.ts`: module wiring
- `backend/src/database/migration.service.ts`: SQL migration runner
- `backend/src/entities`: TypeORM entities
- `backend/src/auth`: login/password + firebase token auth + JWT guard + admin bootstrap
- `backend/src/public`: public controllers/services
- `backend/src/admin`: protected admin controllers/services
- `backend/src/webhooks`: WhatsApp webhook endpoints
- `backend/src/rate-limit`: in-memory rate limiter
- `backend/src/migrations/sql/001_init.sql`: schema bootstrap SQL

Important startup behavior:
- Migrations run automatically before the server starts listening.
- SQL BOM is sanitized in migration loader to prevent PostgreSQL `syntax error at or near "﻿CREATE"`.
- Backend Docker image copies migrations into runtime at `/app/migrations`.

## Domain / Data Model

Main tables:
- `clients`
- `services`
- `appointments`
- `admin_users`
- `gallery_images`
- `manual_income_entries`
- `schema_migrations`

Appointment statuses:
- `PENDING`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`

## Functional Scope

### Public use cases
- View active service catalog
- View active gallery
- Create appointment
- Query occupied time slots by service/date
- Health check endpoint (`/api/health`)

### Admin use cases
- Login in admin UI with Firebase ID token (Google popup only)
- Restrict Google login to active admins authorized in `admin_users`
- Manage authorized admin users from `Admin > Accesos` (create/activate/deactivate/delete)
- Manage appointments (list/update status/update/delete)
- Detect stale pending appointments
- Manage clients (list/update/delete/merge)
- View dashboard overview metrics
- View income metrics by month
- Manage manual income entries
- Manage services CRUD
- Manage gallery CRUD + Cloudinary upload signature endpoint
- Confirm destructive actions using modal dialogs (appointments/clients/services/gallery/income)

### Webhook use case
- WhatsApp webhook verification (`GET /api/webhooks/whatsapp`)
- WhatsApp webhook receive (`POST /api/webhooks/whatsapp`)
- Auto-reply gate logic (controlled by env vars)

## API Surface

Public:
- `GET /api/health`
- `GET /api/public/services`
- `GET /api/public/gallery`
- `GET /api/public/appointments/occupied?serviceId=<uuid>&date=<YYYY-MM-DD>`
- `POST /api/public/appointments`

Auth:
- `POST /api/auth/login`
- `POST /api/auth/login/firebase`

Admin (Bearer token required):
- `GET /api/admin/appointments`
- `GET /api/admin/appointments/stale-pending`
- `PATCH /api/admin/appointments/:id/status`
- `PUT /api/admin/appointments/:id`
- `DELETE /api/admin/appointments/:id`
- `GET /api/admin/clients`
- `PUT /api/admin/clients/:id`
- `POST /api/admin/clients/merge`
- `DELETE /api/admin/clients/:id`
- `GET /api/admin/metrics/overview`
- `GET /api/admin/metrics/income`
- `POST /api/admin/metrics/income/manual`
- `PUT /api/admin/metrics/income/manual/:id`
- `DELETE /api/admin/metrics/income/manual/:id`
- `GET /api/admin/metrics/clients` (compat endpoint)
- `GET /api/admin/services`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `DELETE /api/admin/services/:id`
- `GET /api/admin/gallery`
- `GET /api/admin/gallery/upload-signature`
- `POST /api/admin/gallery/upload`
- `POST /api/admin/gallery`
- `PUT /api/admin/gallery/:id`
- `DELETE /api/admin/gallery/:id`
- `GET /api/admin/admin-users`
- `POST /api/admin/admin-users`
- `PATCH /api/admin/admin-users/:id`
- `DELETE /api/admin/admin-users/:id`

Webhooks:
- `GET /api/webhooks/whatsapp`
- `POST /api/webhooks/whatsapp`

## Runtime Configuration

### Frontend env (root `.env`)
- `VITE_API_BASE_URL`
- `VITE_LOGIN_PATH`
- `VITE_ADMIN_PATH`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

LAN/mobile (optional but currently used):
- `VITE_API_BASE_URL=http://192.168.1.15:8080`

### Backend env (`backend/.env`)
Core:
- `PORT`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRATION_SECONDS`
- `CORS_ALLOWED_ORIGINS`

LAN/mobile (optional but currently used):
- `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.15:5173`

Bootstrap:
- `BOOTSTRAP_ADMIN_ENABLED`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`

Security / rate limit:
- `RATE_LIMIT_PER_MINUTE`

Cloudinary (optional):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER`

WhatsApp webhook (optional):
- `WHATSAPP_AUTOREPLY_ENABLED`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `WHATSAPP_AUTOREPLY_LOOKBACK_MINUTES`
- `WHATSAPP_AUTOREPLY_COOLDOWN_MINUTES`

## Local Development

Frontend:
```powershell
npm install
npm run dev
```

Backend:
```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run start:dev
```

## Docker Development

```powershell
Copy-Item .env.docker.example .env
docker compose up --build
```

Ports:
- Frontend: `5173`
- Backend: `8080`
- PostgreSQL: `5432`

If needed (clean reset):
```powershell
docker compose down -v
docker compose up --build
```

Hot reload mode (recommended while coding):
```powershell
Copy-Item .env.docker.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

In hot reload mode:
- frontend runs Vite dev server with mounted source
- backend runs Nest watch mode with mounted source
- no rebuild is needed for most code changes

Stop hot reload stack:
```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## Important Implementation Notes for Future Agents

0. Engineering standards are mandatory
- For this project it is INDISPENSABLE to apply good engineering practices and SOLID principles in every change.
- Prefer small, cohesive, testable components/services with clear responsibilities.
- Avoid duplicated logic; extract reusable utilities/components when behavior repeats.
- Any refactor or feature must preserve existing visual style unless explicitly requested.

1. Preserve existing UI style
- Do not redesign visual style unless explicitly requested.
- Functional changes should not alter current look and feel.

2. Keep API access centralized
- Frontend should continue using `src/lib/api.ts`.

3. Maintain auth storage policy
- Keep auth token in `sessionStorage` only.
- Do not reintroduce persistent login in `localStorage` unless requested.
- Keep admin login UI Google-only unless explicitly requested.

4. Migration safety
- Keep migration execution before app listen.
- Keep BOM sanitization in SQL loader.
- If adding new migrations, place them in `backend/src/migrations/sql` and ensure runtime copy remains in `backend/Dockerfile`.

5. Docker healthchecks
- Backend healthcheck depends on `/api/health`.
- If backend startup sequence changes, keep this endpoint lightweight and always available.

6. Admin bootstrap
- Bootstrap admin is intended for local/dev use.
- Avoid insecure defaults in production contexts.

7. Known non-blocking warning
- `Browserslist: caniuse-lite is old` is warning only, not a runtime blocker.

8. Preferred local workflow for AI agents
- Use `docker-compose.dev.yml` for iterative development.
- Use base `docker-compose.yml` for production-like validation.

9. Delete constraints and UX
- Do not silently fail on delete operations.
- When a client/service has related appointments, backend should return `400` with clear message.
- Frontend should show modal confirmation and toast with backend error detail.

10. Stale pending filter UX
- In `AppointmentsPage`, prefer discrete preset options (30/60/90/120/180/240 min) over raw numeric input for `olderThanMinutes`.

## Testing / Validation Checklist

Before handoff:
1. `npm run build` (root frontend)
2. `cd backend && npm run build`
3. `docker compose up --build -d`
4. `docker compose ps` (backend and postgres should be healthy)
5. Quick smoke:
- `GET /api/health`
- `GET /api/public/services`

## Current Status Snapshot

- Frontend + backend compile successfully.
- Docker stack starts successfully and reports healthy backend/postgres after fixes.
- Feature parity target with source project has been implemented at core API + admin/public flows.
- Public navbar no longer exposes admin entrypoint.
- Booking flow blocks selecting/confirming past times.
- Admin destructive actions use modal confirmation and show clear error feedback.
- Mobile navbar items have full-row tap targets and corrected section anchoring for `Servicios` and `Contacto`.
- Admin pages (`Dashboard`, `Turnos`, `Clientes`, `Ingresos`) avoid horizontal scrolling on mobile.
- Month selectors in admin were standardized with a reusable component to avoid month/year truncation.
- Admin login page uses Google-only access (no email/password inputs in UI).
- Firebase auth is bound to an allowlist of active admins (`admin_users`).
- Admin includes `Accesos` page for authorized account management.
