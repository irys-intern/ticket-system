import { initializeDatabase } from './db/index.ts';
import { validateSession } from './middleware/sessionValidator.ts'

// Initialize database on server start
await initializeDatabase();
export async function handle({ event, resolve }) {
    event.locals.session = await validateSession(event);
    event.locals.user = event.locals.session ? event.locals.session : null;

    return resolve(event);
}