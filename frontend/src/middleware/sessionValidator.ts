import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function validateSession(event: RequestEvent) {
    // authToken is a first-party cookie on the frontend's own domain (set client-side
    // after login, see $lib/auth.ts) -- not the backend's cross-site session cookie,
    // which SSR load functions have no reliable way to read across Railway subdomains.
    const token = event.cookies.get('authToken');
    if (!token) {
        return null;
    }

    const backendUrl = env.BACKEND_URL ?? 'http://localhost:5172';

    let res: Response;
    try {
        res = await fetch(`${backendUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return null;
    }

    if (!res.ok) {
        event.cookies.delete('authToken', { path: '/' });
        return null;
    }

    const { session } = await res.json();
    return session ?? null;
}
