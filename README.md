<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![SvelteKit][SvelteKit-badge]][SvelteKit-url]
[![Svelte][Svelte-badge]][Svelte-url]
[![TypeScript][TypeScript-badge]][TypeScript-url]
[![PostgreSQL][Postgres-badge]][Postgres-url]
[![Redis][Redis-badge]][Redis-url]
[![FastAPI][FastAPI-badge]][FastAPI-url]

<!-- PROJECT HEADER -->
<br />
<div align="center">
  <a href="https://github.com/irys-intern/ticket-system">
    <img src="frontend/static/favicon.svg" alt="Logo" width="120">
  </a>

  <h3 align="center">Ticket System</h3>

  <p align="center">
    A full-stack support ticket management system with role-based access and NLP-assisted triage
    <br />
    <a href="#architecture"><strong>Explore the architecture »</strong></a>
    <br />
    <br />
    <a href="#setup">Setup</a>
    &middot;
    <a href="#api-reference">API Reference</a>
    &middot;
    <a href="https://github.com/irys-intern/ticket-system/issues/new">Report Bug</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li>
      <a href="#setup">Setup</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#steps">Steps</a></li>
      </ul>
    </li>
    <li><a href="#environment-variables">Environment Variables</a></li>
    <li>
      <a href="#workflow">Workflow</a>
      <ul>
        <li><a href="#user-roles">User Roles</a></li>
        <li><a href="#ticket-lifecycle">Ticket Lifecycle</a></li>
      </ul>
    </li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#nlp-service">NLP Service</a></li>
    <li>
      <a href="#api-reference">API Reference</a>
      <ul>
        <li><a href="#auth">Auth</a></li>
        <li><a href="#tickets">Tickets</a></li>
        <li><a href="#admin">Admin</a></li>
        <li><a href="#training-materials">Training Materials</a></li>
      </ul>
    </li>
    <li><a href="#auth-flow">Auth Flow</a></li>
    <li><a href="#rate-limiting">Rate Limiting</a></li>
    <li><a href="#testing">Testing</a></li>
    <li><a href="#deployment">Deployment</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

A full-stack support ticket management system built with SvelteKit, PostgreSQL, and Redis. Supports role-based access for users, agents, and admins with a full audit trail. Includes an NLP service that suggests ticket priority in real time as users describe their issue.

The project is split into three independent services:

| Path | Description |
| --- | --- |
| **`frontend/`** | SvelteKit UI (pages, components, client-side logic) |
| **`backend/`** | API-only SvelteKit server (JSON endpoints, DB, auth) |
| **`nlp_service/`** | FastAPI server wrapping a zero-shot classifier that suggests ticket priority |

### Built With

* [![SvelteKit][SvelteKit-badge]][SvelteKit-url]
* [![Tailwind CSS][Tailwind-badge]][Tailwind-url]
* [![PostgreSQL][Postgres-badge]][Postgres-url]
* [![Redis][Redis-badge]][Redis-url]
* [![Drizzle ORM][Drizzle-badge]][Drizzle-url]
* [![Better Auth][BetterAuth-badge]][BetterAuth-url]
* [![FastAPI][FastAPI-badge]][FastAPI-url]
* [![Hugging Face Transformers][HuggingFace-badge]][HuggingFace-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- SETUP -->
## Setup

### Prerequisites

* [Node.js](https://nodejs.org/) 20+
* [PostgreSQL](https://www.postgresql.org/) 16
* [Redis](https://redis.io/) 7
* [Python](https://www.python.org/) 3.10+

### Steps

Run all three apps in separate terminals.

Note: you need a Better-Auth key from [better-auth.com](https://better-auth.com/docs/installation)

1. Backend
   ```bash
   cd backend
   npm install
   cp .env.example .env   # fill in env vars
   npx drizzle-kit migrate
   npm run dev
   # Runs at http://localhost:5172
   ```
2. Frontend
   ```bash
   cd frontend
   npm install
   cp .env.example .env   # set env vars
   npm run dev
   # Runs at http://localhost:5173
   ```
3. NLP service
   ```bash
   cd nlp_service
   pip install -r requirements.txt
   # Place your local_model/ folder here (see NLP Service section below)
   uvicorn main:app --port 8000
   # Runs at http://localhost:8000
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ENVIRONMENT VARIABLES -->
## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Yes | Port for the backend server (default: `5172`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgres://user:pass@host:5432/ticket_system` |
| `REDIS_URL` | Yes | Redis connection string, e.g. `redis://host:6379` |
| `BETTER_AUTH_SECRET` | Yes | Secret key for signing auth tokens |
| `FRONTEND_URL` | No | URL of the frontend, used for CORS (e.g. `http://localhost:5173`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Yes | Port for the frontend dev server (default: `5173`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `PUBLIC_BACKEND_URL` | Yes | URL of the backend API (e.g. `http://localhost:5172`) |

### NLP service

No `.env` file needed. The model path and port are configured directly in `nlp_service/main.py`. By default the service expects the model at `nlp_service/local_model/` and listens on port `8000`. The frontend calls it directly from the browser at `http://localhost:8000`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- WORKFLOW -->
## Workflow

### User Roles

| Role | Capabilities |
| --- | --- |
| **User** | Create tickets, view and comment on own tickets, close own tickets |
| **Agent** | View open/assigned tickets, claim and forfeit tickets, update ticket status and metadata (priority/category), comment, access training materials |
| **Admin** | Full access: all tickets, user management, assignments, audit log, stats dashboard, manage training materials |

![User dashboard](images/userdashboard.png)
![Agent dashboard](images/agentdashboard.png)
![Admin dashboard](images/admindashboard.png)
![My tickets](images/mytickets.png)

### Ticket Lifecycle

1. A **user** creates a ticket with a title, description, priority, and category.
2. An **agent** claims the ticket (status &rarr; `in_progress`) or it can be assigned by an **admin**.
3. The agent works the ticket, adding comments and updating status.
4. Status can progress through: `open` &rarr; `in_progress` &rarr; `waiting_for_response` &rarr; `resolved` &rarr; `closed`.
5. A ticket can hit `in_progress` and `waiting_for_response` multiple times before continuing to `resolved`.
6. Once `closed`, no further comments can be added.

![Ticket as seen by user](images/ticketintuser.png)
![Unclaimed ticket (agent view)](images/unclaimedticketint.png)
![Assigned ticket (agent view)](images/assignedticketagent.png)

![Ticket Lifecycle](images/ticketlifecycle.png)

**Priorities**: `low` | `medium` | `high` | `critical`

**Categories**: `bug` | `feature_request` | `support` | `other`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ARCHITECTURE -->
## Architecture

![Ticket System Diagram](images/ticketsystemdiagram.png)

```
ticket-system/
├── frontend/                        # SvelteKit UI app
│   └── src/
│       ├── auth/                    # Better Auth client config
│       ├── config/                  # env.ts: typed env vars
│       ├── db/                      # Drizzle client (read-only queries for SSR)
│       ├── lib/                     # Shared Svelte components and utilities
│       ├── middleware/              # SvelteKit hooks (session validation)
│       ├── routes/                  # File-based pages
│       │   ├── +layout.svelte       # Root layout
│       │   ├── auth/                # login, logout, register pages
│       │   ├── tickets/             # ticket list and detail pages
│       │   ├── create_ticket/       # ticket creation page (calls NLP service for suggestion)
│       │   ├── training/            # training material list and detail pages
│       │   └── admin/               # admin dashboard, stats, users, audit, training mgmt
│       └── types/                   # Shared TypeScript types
│
├── backend/                         # SvelteKit API-only app
│   ├── training-materials/          # Markdown files served as training content
│   └── src/
│       ├── auth/                    # Better Auth server config + Redis session store
│       ├── config/                  # env.ts: typed env vars
│       ├── db/                      # Drizzle ORM schema + client
│       │   └── schema.ts            # tickets, comments, users, audit tables
│       ├── middleware/              # sessionValidator: reads cookie, populates locals.user
│       ├── routes/                  # API endpoints (+server.ts files)
│       │   ├── auth/                # register, login, logout, me
│       │   ├── tickets/             # ticket CRUD and actions
│       │   ├── create_ticket/       # ticket creation endpoint
│       │   ├── create_admin/        # bootstrap first admin account
│       │   ├── training/            # training material listing and content
│       │   └── admin/               # user management, audit log, and stats
│       └── types/                   # Shared TypeScript types
│
└── nlp_service/                     # FastAPI NLP microservice
    ├── main.py                      # /suggest endpoint: zero-shot priority classification
    ├── requirements.txt             # Python dependencies
    └── local_model/                 # facebook/bart-large-mnli weights (not in git)
```

### Stack

| Layer | Technology |
| --- | --- |
| Frontend | [SvelteKit](https://kit.svelte.dev/) 5, [Svelte](https://svelte.dev/) 5, [Tailwind CSS](https://tailwindcss.com/) 4 |
| Backend | [SvelteKit](https://kit.svelte.dev/) 5 (API routes only) |
| NLP service | [FastAPI](https://fastapi.tiangolo.com/), [Hugging Face Transformers](https://huggingface.co/docs/transformers) ([`facebook/bart-large-mnli`](https://huggingface.co/facebook/bart-large-mnli), zero-shot classification) |
| Auth | [Better Auth](https://better-auth.com/) 1.6 (HTTP-only cookie sessions, PostgreSQL session store, Redis session cache) |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) 0.45 |
| Database | [PostgreSQL](https://www.postgresql.org/) 16 |
| Cache | [Redis](https://redis.io/) 7 (Better Auth secondary storage and session token cache) |

### Database Schema

**Business tables** (defined in `backend/src/db/schema.ts`)

| Table | Description |
| --- | --- |
| `usersTable` | email, password hash, role (`user` / `agent` / `admin`) |
| `ticketsTable` | title, description, status, priority, category, creator, assignee |
| `commentsTable` | content, ticket FK, user FK |
| `assignmentsTable` | ticket-to-user assignment records |
| `auditEventsTable` | action type, ticket FK, user FK, timestamp, optional display name |

**Training materials** are stored as Markdown files in `backend/training-materials/`, not in the database. Served via the `/training` API. Slugs are derived from filenames.

**Auth tables** (managed by Better Auth): `user`, `session`, `account`, `verification`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- NLP SERVICE -->
## NLP Service

The NLP service exposes a single endpoint used by the ticket creation form to suggest a priority level before the user submits.

### How it works

1. As the user types in the description field (after 20+ characters), the frontend waits 600 ms then sends the title and description to `POST http://localhost:8000/suggest`.
2. The service runs zero-shot classification against four natural-language label descriptions (one per priority level) using `facebook/bart-large-mnli`.
3. The top-scoring label is returned as a priority string (`low` / `medium` / `high` / `critical`) along with a confidence score.
4. The priority dropdown is pre-filled with the suggestion and a confidence note is shown. The user can override it freely before submitting.
5. If the service is unreachable, the form falls back silently and the user just picks priority manually.

![Partially filled ticket](images/ticketconfidence.png)

### Model setup

The model is **not included in the repository** (weights are large and gitignored). You have two options:

**Option A: let the service download it automatically**

Start the service without a `local_model/` folder present. `main.py` will detect the missing directory, download `facebook/bart-large-mnli` from Hugging Face, and save it to `nlp_service/local_model/`. Requires an internet connection on first run only.

**Option B: download manually**

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
AutoTokenizer.from_pretrained("facebook/bart-large-mnli").save_pretrained("nlp_service/local_model")
AutoModelForSequenceClassification.from_pretrained("facebook/bart-large-mnli").save_pretrained("nlp_service/local_model")
```

Either way, the final path should be `nlp_service/local_model/` containing the model config and weights.

### Endpoint

`POST /suggest`

Request body:
```json
{ "text": "string" }
```

Response:
```json
{ "priority": "medium", "score": 0.842 }
```

Returns `{ "priority": null, "score": 0.0 }` if the input is empty.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- API REFERENCE -->
## API Reference

All endpoints live in `backend/src/routes/` as `+server.ts` files. Responses are JSON. The frontend calls these via `BACKEND_URL`.

### Auth

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Register a new user (email, password >8 chars) | No |
| `POST` | `/auth/login` | Login; sets `sessionId` cookie | No |
| `POST` | `/auth/logout` | Clear session cookie | Yes |
| `GET` | `/auth/me` | Return the current user's session info | Yes |
| `POST` | `/create_admin` | Create an admin account (requires `SUPERUSER_PASSWORD` in body) | No |

### Tickets

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `GET` | `/tickets` | List tickets (scoped by role) | Yes |
| `POST` | `/create_ticket` | Create a new ticket | Yes (user+) |
| `GET` | `/tickets/[id]` | Get a single ticket | Yes |
| `POST` | `/tickets/[id]` | Update ticket status, assignment, or metadata | Yes (agent+) |
| `GET` | `/tickets/[id]/status` | Get ticket status | Yes |
| `GET` | `/tickets/[id]/comments` | List comments on a ticket | Yes |
| `POST` | `/tickets/[id]/comments` | Add a comment (blocked if closed) | Yes |
| `GET` | `/tickets/open` | List all open tickets | Yes (agent+) |

#### `POST /tickets/[id]` actions

The body must include an `action` field:

| `action` | Who | Description |
| --- | --- | --- |
| `claim` | Agent | Assign ticket to self; sets status → `in_progress` |
| `forfeit` | Agent | Remove self-assignment; sets status → `open` |
| `close` | Agent, Admin | Close the ticket |
| `update_status` | Agent | Change status (`open` / `in_progress` / `waiting_for_response` / `resolved`); agent must be assigned |
| `update_metadata` | Agent, Admin | Change `priority` and/or `category`; ticket must not be `closed` or `resolved`; agent must be assigned |
| `assign` | Admin | Assign ticket to any agent; sets status → `in_progress` |
| `unassign` | Admin | Remove assignment; sets status → `open` |

![Admin ticket view](images/adminticketint.png)
![Assign agent dialog](images/assignagent.png)

### Admin

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `GET` | `/admin/users` | List all users | Admin |
| `POST` | `/admin/users` | Change a user's role | Admin |
| `GET` | `/admin/users/[id]` | Get a single user | Admin |
| `GET` | `/admin/audit` | Get audit events (filterable by ticket) | Admin |
| `POST` | `/admin/audit` | Log an audit event | Admin |
| `GET` | `/admin/stats` | Aggregate ticket and user statistics | Admin |

![Manage users](images/manageusers.png)
![Audit log](images/auditlog.png)
![Stats dashboard](images/agentstats.png)

### Training Materials

Training materials are Markdown files stored in `backend/training-materials/`. Agents can read them; only admins can write.

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `GET` | `/training` | List all training materials (slug + title) | Agent, Admin |
| `POST` | `/training` | Create a new training material | Admin |
| `GET` | `/training/[slug]` | Get content of a training material | Agent, Admin |
| `PUT` | `/training/[slug]` | Update content of a training material | Admin |
| `DELETE` | `/training/[slug]` | Delete a training material | Admin |

`POST /training` body: `{ title: string, content: string }`. The slug is derived from the title (lowercase alphanumeric + hyphens). Returns `{ slug }` on success.

`PUT /training/[slug]` body: `{ content: string }` (title is not updated; rename by delete + create).

![Training materials](images/trainingmaterialsview.png)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- AUTH FLOW -->
## Auth Flow

Better Auth handles password hashing, session creation, and session validation. The custom routes (`/auth/register`, `/auth/login`, etc.) are thin wrappers that add input validation and shape the JSON response.

1. **Registration**: `POST /auth/register` validates the input, then delegates to Better Auth's `signUpEmail()`. Better Auth hashes the password and writes a record to the `user` table and a credential record to the `account` table. A session is created and a `sessionId` HTTP-only cookie is returned.
2. **Login**: `POST /auth/login` validates the input, then delegates to Better Auth's `signInEmail()`. Better Auth verifies the password hash and writes a new session record to the `session` table in PostgreSQL. The `sessionId` cookie is set on the response.
3. **Request validation**: A global SvelteKit hook runs on every backend request. It calls Better Auth's `getSession()`, which reads the `sessionId` cookie and validates it first against the Redis session cache, falling back to the PostgreSQL `session` table on a cache miss. If valid, the hook fetches the user's role from `usersTable` and populates `event.locals.user`. Endpoints check `locals.user.role` to enforce access control.
4. **Logout**: `POST /auth/logout` delegates to Better Auth's `signOut()`, which deletes the session record from PostgreSQL and clears the cookie.
5. **Session storage**: Sessions are stored in PostgreSQL (the `session` table) as the source of truth. Active session tokens are also cached in Redis via Better Auth's `secondaryStorage` interface, so most `getSession()` calls are served from Redis without a database round-trip. Each session record includes `expiresAt` (3-day TTL), `ipAddress`, and `userAgent`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- RATE LIMITING -->
## Rate Limiting

The backend's global SvelteKit hook (`hooks.server.ts`) applies a Redis-backed fixed-window rate limit, keyed by client IP, before any auth or session checks run:

| Route(s) | Limit |
| --- | --- |
| `POST /auth/login`, `POST /auth/register` | 10 requests / 60s |
| `POST /create_ticket` | 30 requests / 60s |

Requests over the limit receive a `429` response with a `Retry-After` header indicating how many seconds until the window resets. The limiter logic lives in `backend/src/lib/rateLimit.ts` and is unit tested independently of Redis via an in-memory fake store.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- TESTING -->
## Testing

### Backend

Unit tests cover request validation (`utils/validators.ts`), markdown sanitization (`utils/sanitizeMarkdown.ts`), and the rate limiter (`lib/rateLimit.ts`).

```bash
cd backend
npm run test:unit
```

### Frontend

An end-to-end test (`src/routes/golden-path.e2e.ts`) drives a real browser through the core golden path&mdash;register, log in, create a ticket&mdash;against a live backend, database, and Redis instance. Start the backend (and Postgres/Redis) first, then run:

```bash
cd frontend
npm run test:e2e
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- DEPLOYMENT -->
## Deployment

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

Use a process manager (e.g. [PM2](https://pm2.keymetrics.io/)) to keep both processes running and restart on crash.

### NLP service (production)

Start the service with a process manager alongside the other two apps:

```bash
cd nlp_service
uvicorn main:app --host 0.0.0.0 --port 8000
```

Update the `allow_origins` list in `nlp_service/main.py` to include your production frontend domain before deploying.

The `local_model/` directory must be present on the server. Either commit the weights out-of-band (e.g. via [Git LFS](https://git-lfs.com/) or a cloud volume) or run the auto-download on first start with an internet connection.

### Checklist

- [ ] `DATABASE_URL` points to production PostgreSQL (backend)
- [ ] `REDIS_URL` points to production Redis (backend)
- [ ] `BETTER_AUTH_SECRET` is set to a secure random value (backend)
- [ ] `FRONTEND_URL` matches your production frontend domain (backend, for CORS)
- [ ] `BACKEND_URL` matches your production backend domain (frontend)
- [ ] `NODE_ENV=production` in both apps
- [ ] Migrations have been run against the production database
- [ ] HTTPS is terminated upstream (reverse proxy like [nginx](https://nginx.org/) or a platform like [Railway](https://railway.app/)/[Render](https://render.com/))
- [ ] `allow_origins` in `nlp_service/main.py` includes the production frontend URL
- [ ] `local_model/` weights are present on the production server
- [ ] NLP service is running and reachable from the frontend origin

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Eli Friedman (elimfriedman22@gmail.com)<br>
[![Connect with me on LinkedIn][LinkedIn-badge]][LinkedIn-url]
[![Email Me][Gmail-badge]][Gmail-url]
[![View my GitHub][Github-badge]][Github-url]
[![View my Instagram][Insta-badge]][Insta-url]

Project Link: [https://github.com/irys-intern/ticket-system](https://github.com/irys-intern/ticket-system)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[SvelteKit-badge]: https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white
[SvelteKit-url]: https://kit.svelte.dev/
[Svelte-badge]: https://img.shields.io/badge/Svelte_5-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[TypeScript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Tailwind-badge]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Postgres-badge]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[Postgres-url]: https://www.postgresql.org/
[Redis-badge]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/
[Drizzle-badge]: https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black
[Drizzle-url]: https://orm.drizzle.team/
[BetterAuth-badge]: https://img.shields.io/badge/Better_Auth-000000?style=for-the-badge&logoColor=white
[BetterAuth-url]: https://better-auth.com/
[FastAPI-badge]: https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white
[FastAPI-url]: https://fastapi.tiangolo.com/
[HuggingFace-badge]: https://img.shields.io/badge/%F0%9F%A4%97%20Transformers-FFD21E?style=for-the-badge
[HuggingFace-url]: https://huggingface.co/docs/transformers
[LinkedIn-badge]: https://img.shields.io/badge/-LinkedIn-blue?logo=Linkedin&logoColor=white&link=eli-friedman-a5923a33a
[LinkedIn-url]: https://www.linkedin.com/in/eli-friedman-a5923a33a
[Gmail-badge]: https://img.shields.io/badge/Gmail-D14836?logo=gmail&logoColor=white
[Gmail-url]: mailto:elimfriedman22@gmail.com
[Github-badge]: https://img.shields.io/badge/GitHub-%23121011.svg?logo=github&logoColor=white
[Github-url]: https://github.com/wrentmc
[Insta-badge]: https://img.shields.io/badge/Instagram-%23E4405F.svg?logo=Instagram&logoColor=white
[Insta-url]: https://www.instagram.com/eli.friedman2