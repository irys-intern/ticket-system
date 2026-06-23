# Ticket System

A full-stack support ticket management system built with SvelteKit, Express, PostgreSQL, and Redis. Supports role-based access for users, agents, and admins with a full audit trail.

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

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Run database migrations
npx drizzle-kit migrate

# Start the development server
npm run dev
```

The dev server runs at `http://localhost:5173`.

### Docker (coming soon)

Docker and docker-compose configuration is in progress. When complete, the full stack (app, PostgreSQL, Redis) will be startable with:

```bash
docker-compose up
```

The compose file will expose:
- App: port `3000`
- PostgreSQL: port `5432`
- Redis: port `6379`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port for the Express server (default: `3000`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgres://user:pass@host:5432/ticket_system` |
| `REDIS_URL` | Yes | Redis connection string, e.g. `redis://host:6379` |
| `BETTER_AUTH_SECRET` | Yes | Secret key for signing auth tokens |
| `FRONTEND_URL` | Yes | URL of the frontend, used for CORS (e.g. `http://localhost:5173`) |
| `PORT` | Yes | Port of the server (e.g. 5173)
| `SUPERUSER_PASSWORD` | Yes | Password required to create the first admin account via `POST /create_admin` |

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
├── src/
│   ├── auth/
│   │   ├── auth.ts              # Better Auth configuration (cookie-based sessions)
│   │   └── redis-session.ts     # Redis session store
│   ├── db/
│   │   └── schema.ts            # Drizzle ORM schema (tickets, comments, users, audit)
│   ├── middleware/
│   │   └── sessionValidator.ts  # Session validation from cookies
│   ├── routes/                  # SvelteKit file-based routes (pages + API endpoints)
│   │   ├── auth/                # register, login, logout
│   │   ├── tickets/             # ticket CRUD and actions
│   │   └── admin/               # user management and audit log
│   ├── hooks.server.ts          # SvelteKit server hook — validates session, populates locals.user
│   └── app.html                 # Root HTML shell
├── auth-schema.ts               # Better Auth DB tables (user, session, account, verification)
├── drizzle.config.ts            # Drizzle migration config
├── svelte.config.js             # SvelteKit config
└── vite.config.ts               # Vite / Vitest / Playwright config
```

### Stack

| Layer | Technology |
|---|---|
| Frontend | SvelteKit 5, Svelte 5, Tailwind CSS 4 |
| Backend | SvelteKit API routes + Express 5 |
| Auth | Better Auth 1.6 (HTTP-only cookie sessions) |
| ORM | Drizzle ORM 0.45 |
| Database | PostgreSQL 16 |
| Session store | Redis 7 |
| Testing | Vitest (unit), Playwright (E2E) |

### Database Schema

**Business tables**

- `usersTable` — email, password hash, role (`user` / `agent` / `admin`)
- `ticketsTable` — title, description, status, priority, category, creator, assignee
- `commentsTable` — content, ticket FK, user FK
- `assignmentsTable` — ticket-to-user assignment records
- `auditEventsTable` — action type, ticket FK, user FK, timestamp, optional display name

**Auth tables** (managed by Better Auth)

- `user`, `session`, `account`, `verification`

---

## API Reference

All endpoints are SvelteKit server routes under `src/routes/`. Responses are JSON.

### Auth

| Method | Path | Description | Auth required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user (email, password >8 chars) | No |
| `POST` | `/auth/login` | Login; sets `sessionId` cookie | No |
| `POST` | `/auth/logout` | Clear session cookie | Yes |
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
| `GET` | `/admin/audit` | Get audit events (filterable by ticket) | Admin |
| `POST` | `/admin/audit` | Log an audit event (internal) | Admin |

---

## Auth Flow

1. **Registration** — `POST /auth/register` hashes the password with `scryptSync` + random salt and stores it in `usersTable`. A session is created and the `sessionId` is returned as an HTTP-only cookie.

2. **Login** — `POST /auth/login` verifies the scrypt hash. On success, a session record is written to PostgreSQL (via Better Auth) and cached in Redis. The `sessionId` cookie is set.

3. **Request validation** — `src/hooks.server.ts` runs on every request. It reads the `sessionId` cookie, looks up the session in Redis (fallback: PostgreSQL), and populates `event.locals.user`. Endpoints then read `locals.user` and check the `role` field to enforce access control.

4. **Logout** — `POST /auth/logout` deletes the session from Redis and PostgreSQL and clears the cookie.

5. **Session storage** — Sessions are stored in Redis for fast lookup with PostgreSQL as the source of truth. Sessions carry expiration timestamps and record the client IP and user agent.

---

## Deployment

> Docker-based deployment is in progress. The steps below are for a manual deployment.

### Build

```bash
npm run build
```

Output goes to `.svelte-kit/output` (via the SvelteKit adapter).

### Environment

Set all [environment variables](#environment-variables) in your hosting environment. Ensure `NODE_ENV=production` and `BETTER_AUTH_SECRET` is a long random string.

### Database

Run migrations against your production database before starting the app:

```bash
npx drizzle-kit migrate
```

### Start

```bash
node build
```

Or configure a process manager (e.g. PM2) to run `node build` and restart on crash.

### Checklist

- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] `REDIS_URL` points to production Redis
- [ ] `BETTER_AUTH_SECRET` is set to a secure random value
- [ ] `FRONTEND_URL` matches your production domain (for CORS)
- [ ] `NODE_ENV=production`
- [ ] Migrations have been run
- [ ] HTTPS is terminated upstream (reverse proxy like nginx or a platform like Railway/Render)
