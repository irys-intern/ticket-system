import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function validateSession(event: RequestEvent) {
    const sessionId = event.cookies.get('sessionId');
    if (!sessionId) {
        return null;
    }

    const backendUrl = env.BACKEND_URL ?? 'http://localhost:5172';

    let res: Response;
    try {
        res = await fetch(`${backendUrl}/auth/me`, {
            headers: { cookie: `sessionId=${sessionId}` },
        });
    } catch {
        return null;
    }

    if (!res.ok) {
        event.cookies.delete('sessionId', { path: '/' });
        return null;
    }

    const { session } = await res.json();
    return session ?? null;
}
