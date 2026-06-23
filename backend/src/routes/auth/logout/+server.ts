import { json, type RequestHandler } from '@sveltejs/kit';
import { sessionStore } from '../../../auth/redis-session.ts';

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    const sessionId = cookies.get('sessionId');
    if (sessionId) {
      await sessionStore.deleteSession(sessionId);
    }
    return json({ success: true, message: 'Logout successful' }, { status: 200 });
    } catch (error) {
        console.error('Logout error:', error);
        const message = error instanceof Error ? error.message : String(error);
        return json({ success: false, errors: [message] }, { status: 500 });
    }
};