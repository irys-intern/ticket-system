# Ticket System

A full-stack support ticket management system built with SvelteKit, Express, PostgreSQL, and Redis. Supports role-based access for users, agents, and admins with a full audit trail.

The project is split into two independent SvelteKit apps:

- **`frontend/`** — Svelte UI (pages, components, client-side logic)
- **`backend/`** — API-only SvelteKit server (JSON endpoints, DB, auth)

---

## Table of Contents

- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Workflow](#workflow)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Auth Flow](#auth-flow)
- [Deployment](#deployment)

---

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis 7

### Steps

Run both apps in separate terminals:

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env   # fill in env vars
npx drizzle-kit migrate
npm run dev
# Runs at http://localhost:5172
```

```bash
# Terminal 2 — frontend
cd frontend
npm install
cp .env.example .env   # set BACKEND_URL
npm run dev
# Runs at http://localhost:5173
```

### Docker (coming soon)

Docker and docker-compose configuration is in progress. When complete, the full stack (frontend, backend, PostgreSQL, Redis) will be startable with:

```bash
docker-compose up
```

The compose file will expose:
- Frontend: port `5173`
- Backend: port `5172`
- PostgreSQL: port `5432`
- Redis: port `6379`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port for the backend server (default: `5172`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgres://user:pass@host:5432/ticket_system` |
| `REDIS_URL` | Yes | Redis connection string, e.g. `redis://host:6379` |
| `BETTER_AUTH_SECRET` | Yes | Secret key for signing auth tokens |
| `FRONTEND_URL` | Yes | URL of the frontend, used for CORS (e.g. `http://localhost:5173`) |
| `SUPERUSER_PASSWORD` | Yes | Password required to create the first admin account via `POST /create_admin` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port for the frontend dev server (default: `5173`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `BACKEND_URL` | Yes | URL of the backend API (e.g. `http://localhost:5172`) |

---

## Workflow

### User Roles

| Role | Capabilities |
|---|---|
| **User** | Create tickets, view and comment on own tickets, close own tickets |
| **Agent** | View open/assigned tickets, claim and forfeit tickets, update ticket status, comment |
| **Admin** | Full access: all tickets, user management, assignments, audit log |

### Ticket Lifecycle

1. A **user** creates a ticket with a title, description, priority, and category.
2. An **agent** claims the ticket (status → `in_progress`) or it can be assigned by an **admin**.
3. The agent works the ticket, adding comments and updating status.
4. Status can progress through: `open` → `in_progress` → `waiting_for_response` → `resolved` → `closed`.
5. A ticket can hit `in_progress` and `waiting_for_response` multiple times before continuing to `resolved`.
6. Once `closed`, no further comments can be added.

### Priorities

`low` | `medium` | `high` | `critical`

### Categories

`bug` | `feature_request` | `support` | `other`

---

## Architecture

```
ticket-system/
├── frontend/                        # SvelteKit UI app
│   └── src/
│       ├── auth/                    # Better Auth client config
│       ├── config/                  # env.ts — typed env vars
│       ├── db/                      # Drizzle client (read-only queries for SSR)
│       ├── lib/                     # Shared Svelte components and utilities
│       ├── middleware/              # SvelteKit hooks (session validation)
│       ├── routes/                  # File-based pages
│       │   ├── +layout.svelte       # Root layout
│       │   ├── auth/                # login, logout, register pages
│       │   ├── tickets/             # ticket list and detail pages
│       │   ├── create_ticket/       # ticket creation page
│       │   └── admin/               # admin dashboard pages
│       └── types/                   # Shared TypeScript types
│
└── backend/                         # SvelteKit API-only app
    └── src/
        ├── auth/                    # Better Auth server config + Redis session store
        ├── config/                  # env.ts — typed env vars
        ├── db/                      # Drizzle ORM schema + client
        │   └── schema.ts            # tickets, comments, users, audit tables
        ├── middleware/              # sessionValidator — reads cookie, populates locals.user
        ├── routes/                  # API endpoints (+server.ts files)
        │   ├── auth/                # register, login, logout, me
        │   ├── tickets/             # ticket CRUD and actions
        │   ├── create_ticket/       # ticket creation endpoint
        │   ├── create_admin/        # bootstrap first admin account
        │   └── admin/               # user management and audit log
        └── types/                   # Shared TypeScript types
```

### Stack

| Layer | Technology |
|---|---|
| Frontend | SvelteKit 5, Svelte 5, Tailwind CSS 4 |
| Backend | SvelteKit 5 (API routes only) |
| Auth | Better Auth 1.6 (HTTP-only cookie sessions) |
| ORM | Drizzle ORM 0.45 |
| Database | PostgreSQL 16 |
| Session store | Redis 7 |
| Testing | Vitest (unit), Playwright (E2E) |

### Database Schema

**Business tables** (defined in `backend/src/db/schema.ts`)

- `usersTable` — email, password hash, role (`user` / `agent` / `admin`)
- `ticketsTable` — title, description, status, priority, category, creator, assignee
- `commentsTable` — content, ticket FK, user FK
- `assignmentsTable` — ticket-to-user assignment records
- `auditEventsTable` — action type, ticket FK, user FK, timestamp, optional display name

**Auth tables** (managed by Better Auth)

- `user`, `session`, `account`, `verification`

---

## API Reference

All endpoints live in `backend/src/routes/` as `+server.ts` files. Responses are JSON. The frontend calls these via `BACKEND_URL`.

### Auth

| Method | Path | Description | Auth required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user (email, password >8 chars) | No |
| `POST` | `/auth/login` | Login; sets `sessionId` cookie | No |
| `POST` | `/auth/logout` | Clear session cookie | Yes |
| `GET` | `/auth/me` | Return the current user's session info | Yes |
| `POST` | `/create_admin` | Create an admin account (requires `SUPERUSER_PASSWORD` in body) | No |

### Tickets

| Method | Path | Description | Auth required |
|---|---|---|---|
| `GET` | `/tickets` | List tickets (scoped by role) | Yes |
| `POST` | `/create_ticket` | Create a new ticket | Yes (user+) |
| `GET` | `/tickets/[id]` | Get a single ticket | Yes |
| `POST` | `/tickets/[id]` | Update ticket status or assignment | Yes (agent+) |
| `GET` | `/tickets/[id]/status` | Get ticket status | Yes |
| `GET` | `/tickets/[id]/comments` | List comments on a ticket | Yes |
| `POST` | `/tickets/[id]/comments` | Add a comment (blocked if closed) | Yes |
| `GET` | `/tickets/open` | List all open tickets | Yes (agent+) |

### Admin

| Method | Path | Description | Auth required |
|---|---|---|---|
| `GET` | `/admin/users` | List all users | Admin |
| `POST` | `/admin/users` | Change a user's role | Admin |
| `GET` | `/admin/users/[id]` | Get a single user | Admin |
| `GET` | `/admin/audit` | Get audit events (filterable by ticket) | Admin |
| `POST` | `/admin/audit` | Log an audit event | Admin |

---

## Auth Flow

1. **Registration** — `POST /auth/register` hashes the password with `scryptSync` + random salt and stores it in `usersTable`. A session is created and the `sessionId` is returned as an HTTP-only cookie.

2. **Login** — `POST /auth/login` verifies the scrypt hash. On success, a session record is written to PostgreSQL (via Better Auth) and cached in Redis. The `sessionId` cookie is set.

3. **Request validation** — The backend's session middleware runs on every request. It reads the `sessionId` cookie, looks up the session in Redis (fallback: PostgreSQL), and populates `event.locals.user`. Endpoints check `locals.user.role` to enforce access control.

4. **Logout** — `POST /auth/logout` deletes the session from Redis and PostgreSQL and clears the cookie.

5. **Session storage** — Sessions are stored in Redis for fast lookup with PostgreSQL as the source of truth. Sessions carry expiration timestamps and record the client IP and user agent.

---

## Deployment

> Docker-based deployment is in progress. The steps below are for a manual deployment.

### Build

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### Database

Run migrations against your production database before starting the backend:

```bash
cd backend
npx drizzle-kit migrate
```

### Start

```bash
# Backend
cd backend && node build

# Frontend
cd frontend && node build
```

Use a process manager (e.g. PM2) to keep both processes running and restart on crash.

### Checklist

- [ ] `DATABASE_URL` points to production PostgreSQL (backend)
- [ ] `REDIS_URL` points to production Redis (backend)
- [ ] `BETTER_AUTH_SECRET` is set to a secure random value (backend)
- [ ] `FRONTEND_URL` matches your production frontend domain (backend, for CORS)
- [ ] `BACKEND_URL` matches your production backend domain (frontend)
- [ ] `NODE_ENV=production` in both apps
- [ ] Migrations have been run against the production database
- [ ] HTTPS is terminated upstream (reverse proxy like nginx or a platform like Railway/Render)
