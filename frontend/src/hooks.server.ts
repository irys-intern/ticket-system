import { initializeDatabase } from './db/index.ts';
import { validateSession } from './middleware/sessionValidator.ts'

// Initialize database on server start
await initializeDatabase();
export async function handle({ event, resolve }) {
    const session = await validateSession(event);
    event.locals.session = session;
    event.locals.user = session ? {
        userId: session.userId,
        email: session.email,
        name: session.name,
        role: session.role
    } : null;

    return resolve(event);
}