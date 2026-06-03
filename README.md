# Ticket System

A modern ticket management system with role-based access control built with Node.js, Express, TypeScript, PostgreSQL, and Drizzle ORM.

## Features

- **User Management**: Support for user, agent, and admin roles
- **Ticket Management**: Create, update, and track support tickets
- **Status Tracking**: Open, In Progress, Resolved, Closed, Reopened states
- **Priority Levels**: Low, Medium, High, Urgent priority levels
- **Categories**: Bug reports, feature requests, support, and other ticket types
- **Comments & Audit Trail**: Track all changes and discussions on tickets
- **Role-Based Access**: Different permissions for users, agents, and admins

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript with strict mode
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod
- **Cache**: Redis (optional)
- **Auth**: Better Auth (to be integrated)
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

## Project Structure

```
src/
├── config/          # Configuration files (env variables)
├── db/              # Database schema and migrations
├── auth/            # Authentication setup
├── routes/          # API route definitions
├── controllers/     # Business logic handlers
├── middleware/      # Express middleware (auth, error handling, etc.)
├── types/           # TypeScript types and enums
├── utils/           # Validation schemas and utilities
└── tests/           # Test files
```

## Setup Instructions

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+ (optional, for caching)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start PostgreSQL and Redis** (using Docker)
   ```bash
   docker-compose up -d
   ```

4. **Generate and run migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests with Vitest
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run pending migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Tickets
- `GET /api/tickets` - List all tickets (with pagination, search, filter)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PATCH /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/assign` - Assign ticket (agent/admin only)
- `PATCH /api/tickets/:id/status` - Update ticket status
- `GET /api/tickets/:id/comments` - Get ticket comments (TODO)
- `POST /api/tickets/:id/comments` - Add comment to ticket (TODO)

### Users
- `GET /api/users` - List all users (admin/agent only)
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user

## Environment Variables

See `.env.example` for all available options.

Key variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `BETTER_AUTH_SECRET` - Secret key for authentication
- `FRONTEND_URL` - Frontend URL for CORS

## Development Workflow

1. **Database Changes**
   - Modify schema in `src/db/schema.ts`
   - Run `npm run db:generate` to create migration
   - Run `npm run db:migrate` to apply migration

2. **Adding Routes**
   - Create controller in `src/controllers/`
   - Define route in `src/routes/`
   - Import in `src/routes/index.ts`

3. **Code Quality**
   - Run `npm run lint` before committing
   - Run `npm run format` to auto-format code
   - Use TypeScript strict mode (enabled)

## Next Steps

- [ ] Implement Better Auth integration
- [ ] Complete auth endpoints (register, login, logout)
- [ ] Implement ticket CRUD operations
- [ ] Add comment functionality
- [ ] Implement search and filtering
- [ ] Add pagination
- [ ] Create comprehensive API tests
- [ ] Set up frontend integration
- [ ] Deploy to production

## License

ISC
