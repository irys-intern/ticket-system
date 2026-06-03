## Start with the foundation

### 1. Initialize the backend first
- Create the Node.js + Express + TypeScript app
- Configure TypeScript strict mode
- Set up basic folder structure and linting

### 2. Define the database schema
- Design PostgreSQL tables: `users`, `tickets`, `comments`, `assignments`, `audit_events`
- Add enums for category, priority, status
- Use Drizzle ORM and create the first migration

### 3. Add auth and roles
- Integrate Better Auth for sessions
- Implement `user`, `agent`, `admin` roles
- Build auth routes: `/auth/register`, `/auth/login`, `/auth/logout`

---

## Why this order?
- The backend and database are the core of the app
- Auth + roles are required before ticket access and UI flows
- Once the API is stable, the frontend can be built against it

If you want the absolute first task:
- set up your backend project structure and the PostgreSQL/Drizzle schema.