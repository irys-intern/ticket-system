<a id="readme-top"></a>

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
    <br />
    <a href="#getting-started">Getting Started</a>
    &middot;
    <a href=".assets/ARCHITECTURE.md#api-reference">API Reference</a>
    &middot;
    <a href="https://github.com/irys-intern/ticket-system/issues/new">Report Bug</a>
  </p>
</div>

<!-- PROJECT SHIELDS -->
<div align="center">

[![SvelteKit][SvelteKit-badge]][SvelteKit-url]
[![TypeScript][TypeScript-badge]][TypeScript-url]
[![Better Auth][BetterAuth-badge]][BetterAuth-url]
[![PostgreSQL][Postgres-badge]][Postgres-url]
[![FastAPI][FastAPI-badge]][FastAPI-url]

</div>

<!-- ABOUT THE PROJECT -->

## About The Project

Ticket System is a help desk for teams that need a simple way to handle incoming issues and requests. Users submit tickets and the system suggests a priority as they type; agents claim tickets from a shared queue, work them through comments, and update status until resolved; admins oversee users, assignments, and ticket activity across the board.

<details>
  <summary><strong>Table Of Contents</strong></summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#install-dependencies">Install Dependencies</a></li>
        <li><a href="#download-nlp-model">Download NLP Model</a></li>
        <li><a href="#run-database-migration">Run Database Migration</a></li>
        <li><a href="#start-development-servers">Start Development Servers</a></li>
        <li>
          <a href="#manual-install">Manual Install</a>
          <ul>
            <li><a href="#manual-dependency-install">Manual Dependency Install</a></li>
            <li><a href="#database-migration">Database Migration</a></li>
            <li><a href="#start-development-servers-1">Start Development Servers</a></li>
          </ul>
        </li>
      </ul>
    </li>
    <li><a href="#testing">Testing</a></li>
    <li><a href="#deployment">Deployment</a></li>
    <li>
      <a href="#reference">Reference</a>
      <ul>
        <li><a href=".assets/ARCHITECTURE.md#stack">Stack</a></li>
        <li><a href=".assets/ARCHITECTURE.md#directory-structure">Directory Structure</a></li>
        <li><a href=".assets/ARCHITECTURE.md#database-schema">Database Schema</a></li>
        <li><a href=".assets/ARCHITECTURE.md#database-permissions">Database Permissions</a></li>
        <li><a href=".assets/ARCHITECTURE.md#auth-flow">Auth Flow</a></li>
        <li><a href=".assets/ARCHITECTURE.md#rate-limiting">Rate Limiting</a></li>
        <li><a href=".assets/ARCHITECTURE.md#dashboard-caching">Dashboard Caching</a></li>
        <li><a href=".assets/ARCHITECTURE.md#api-reference">API Reference</a></li>
        <li><a href=".assets/ARCHITECTURE.md#workflow">Workflow</a></li>
        <li><a href=".assets/ARCHITECTURE.md#nlp-service">NLP Service</a></li>
      </ul>
    </li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

Make sure you have the following installed and available before setting up the project.

| Requirement            | Link                                      | Usage                            |
| ---------------------- | ----------------------------------------- | -------------------------------- |
| Node.js 20+            | https://nodejs.org/                       | Running the frontend and backend |
| PostgreSQL 16          | https://www.postgresql.org/               | Primary database                 |
| Redis 7                | https://redis.io/                         | Session, rate-limit, and dashboard/settings cache |
| Python 3.10+           | https://www.python.org/                   | Running the NLP service          |
| Better Auth secret key | https://better-auth.com/docs/installation | Signing auth session tokens      |

### Install Dependencies

Once the prerequisites are installed, run the dependencies script from the repo root. It checks that the prerequisites above are met, installs packages for all three services, and sets up their `.env` files.

```bash
python3 dependencies.py
```

If Postgres and/or Redis are running in Docker rather than installed on your host, the script won't find `psql`/`redis-cli` on `PATH` and will fail the prerequisite check. Skip it with:

```bash
python3 dependencies.py --skip-service-checks
```

This only skips the PATH check for those two clients -- it doesn't verify the containers are actually reachable, so make sure `DATABASE_URL`/`REDIS_URL` in `backend/.env` point at them correctly.

### Download NLP Model

Optional: the NLP service downloads its model automatically on first start, but you can fetch it ahead of time (useful before an offline deploy, or just to avoid the wait on your first request):

```bash
python3 fetchmodel.py
```

### Run Database Migration

Once the backend's `.env` is configured, apply the schema to your Postgres database:

```bash
python3 migratedb.py
```

For local development this works fine against the same `DATABASE_URL` the app uses at runtime. If you've locked that role down to row-level access only (recommended for production &mdash; see [Database Permissions](.assets/ARCHITECTURE.md#database-permissions)), point this at a privileged connection instead.

### Start Development Servers

Once dependencies are installed and migrations are applied, start all three dev servers at once from the repo root:

```bash
python3 devserver.py
```

### Manual Install

<details>
<summary>Skip the scripts and do it all by hand</summary>

#### Manual Dependency Install

Here's the same dependency setup by hand (without the version checks):

**Backend**

```bash
cd backend
npm install
cp .env.example .env   # fill in env vars, see comments in .env.example
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env   # set env vars, see comments in .env.example
```

**NLP service**

```bash
cd nlp_service
python3 -m venv .venv
source .venv/bin/activate   # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Optionally, fetch the model ahead of time instead of waiting for it to download on first start:

```bash
python3 ../fetchmodel.py
```

#### Database Migration

```bash
cd backend
npx drizzle-kit migrate
```

Optionally, seed demo data or promote an existing user to admin:

```bash
cd backend
npm run seed                          # populate demo users, tickets, and comments
npm run create_admin -- <email>       # promote an already-registered user to admin
```

#### Start Development Servers

Run each in a separate terminal.

```bash
cd backend
npm run dev
# Runs at http://localhost:5172
```

```bash
cd frontend
npm run dev
# Runs at http://localhost:5173
```

```bash
cd nlp_service
source .venv/bin/activate   # on Windows: .venv\Scripts\activate
uvicorn main:app --port 8000
# Runs at http://localhost:8000
```

</details>

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

<!-- DEPLOYMENT -->

## Deployment

Use a process manager (e.g. [PM2](https://pm2.keymetrics.io/)) to keep all three processes running and restart on crash.

### Backend

```bash
cd backend
npm run build
npx drizzle-kit migrate   # run against your production database before starting
node build
```

### Frontend

```bash
cd frontend
npm run build
node build
```

### NLP Service (Production)

Start the service with a process manager alongside the other two apps:

```bash
cd nlp_service
uvicorn main:app --host 0.0.0.0 --port 8000
```

Update the `allow_origins` list in `nlp_service/main.py` to include your production frontend domain before deploying.

The `local_model/` directory must be present on the server. Either commit the weights out-of-band (e.g. via [Git LFS](https://git-lfs.com/) or a cloud volume) or run the auto-download on first start with an internet connection.

<!-- REFERENCE -->

## Reference

See [ARCHITECTURE.md](.assets/ARCHITECTURE.md) for the system diagram, tech stack, directory structure, database schema, auth flow, rate limiting, full API reference, ticket workflow, and NLP service internals.

<!-- CONTACT -->

## Contact

<div align="center">

**Eli Friedman** &middot; Primary Maintainer

[![Connect with me on LinkedIn][LinkedIn-badge]][LinkedIn-url]
[![Email Me][Gmail-badge]][Gmail-url]
[![View my GitHub][Github-badge]][Github-url]
[![View my Instagram][Insta-badge]][Insta-url]

</div>

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
