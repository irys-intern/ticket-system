import { validateSession } from './middleware/sessionValidator.ts';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
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
