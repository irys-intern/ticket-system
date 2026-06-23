import { json, type RequestHandler } from '@sveltejs/kit';
import { sessionStore } from '../../../auth/redis-session.ts';

export const GET: RequestHandler = async ({ cookies }) => {
    const sessionId = cookies.get('sessionId');
    if (!sessionId) {
        return json({ valid: false }, { status: 401 });
    }
    const { valid, session } = await sessionStore.validateSession(sessionId);
    if (!valid || !session) {
        return json({ valid: false }, { status: 401 });
    }
    return json({ valid: true, session });
};
