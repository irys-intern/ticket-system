# SWE Internship Project: Ticketing System
## Overview
Build a ticketing system that allows users to create, manage, assign, and resolve support tickets. The project should demonstrate competency across frontend development, backend APIs, authentication, authorization, database design, caching, testing, and containerization.
# Required Technology Stack
## Frontend
* SvelteKit
* TypeScript
* Tailwind CSS
* TanStack Query
* Zod
## Backend
* Node.js
* Express.js
* TypeScript
## Authentication
* Better Auth
## Database
* PostgreSQL
* Drizzle ORM
## Cache
* Redis
## Infrastructure
* Docker
* Docker Compose
# User Roles
## User
Can:
* Create tickets
* View own tickets
* Comment on own tickets
## Agent
Can:
* View assigned tickets
* Update ticket status
* Assign tickets
* Comment on tickets
## Admin
Can:
* View all tickets
* Manage users
* Manage assignments
* Access analytics dashboard
# Functional Requirements
## Authentication
Implement using Better Auth.<br>
Features:
* Register
* Login
* Logout
* Session management
* Protected routes
* Role-based access control
# Ticket Management
## Create Ticket
Fields:
* Title
* Description
* Category
* Priority
## Priority values:
* LOW
* MEDIUM
* HIGH
* CRITICAL
Default status:
* OPEN
## Ticket Status Workflow
Supported statuses:
* OPEN
* IN_PROGRESS
* WAITING_FOR_RESPONSE
* RESOLVED
* CLOSED
Valid transitions:
* OPEN → IN_PROGRESS
* IN_PROGRESS → WAITING_FOR_RESPONSE
* WAITING_FOR_RESPONSE → IN_PROGRESS
* IN_PROGRESS → RESOLVED
* RESOLVED → CLOSED
Enforce validation on the backend.
## Assignment
Agents and admins must be able to:
* Assign tickets
* Reassign tickets
## Comments
Users and agents can:
* Add comments
* View comments
## Audit Trail
Track the following events:
* Ticket created
* Ticket updated
* Ticket assigned
* Ticket reassigned
* Status changed
* Comment added
Display events on the ticket detail page.
## Search & Filtering
Support:
* Status
* Priority
* Assignee
* Category
* Date range
Search fields:
* Ticket title
* Ticket description
Implement server-side pagination.
# Documentation Requirements
Repository must contain:
## README
Include:
* Setup instructions
* Environment variables
* Local development workflow
* Architecture overview
* API documentation
## Architecture Diagram
Show:
* Frontend
* API
* PostgreSQL
* Redis
* Authentication flow
## Database ERD
Show all table relationships.
# Engineering Expectations
* TypeScript strict mode enabled
* ESLint configured
* Prettier configured
* No use of any
* Drizzle migrations used
* Meaningful commit history
* Feature branches required
# Deliverables
1. Source code repository
1. README
1. ERD diagram
1. Architecture diagram
1. Docker Compose setup
1. Automated test suite
The project will be evaluated on architecture, code quality, security, testing, maintainability, and completeness.<br>
Design your system to be spun up on a remote host using nothing but the Docker image and some env variables :&rpar;