import type { RequestEvent } from '@sveltejs/kit';
import { sessionStore } from '../auth/redis-session.ts';

export async function validateSession(event: RequestEvent) {
    const sessionId = event.cookies.get('sessionId');
    if (!sessionId) {
        return null
    }
    const { valid, session } = await sessionStore.validateSession(sessionId);
    if (!valid || !session) {
        event.cookies.delete('sessionId', { path: '/' });
        return null;
    }
    return session;
}