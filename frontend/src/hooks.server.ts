import { validateSession } from './middleware/sessionValidator.ts';

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
