import { json, type RequestHandler } from '@sveltejs/kit';
import { auth } from '../../../auth/auth.ts';

export const GET: RequestHandler = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return json({ valid: false }, { status: 401 });
    }

    const user = session.user as typeof session.user & { role?: string };
    return json({
        valid: true,
        session: {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role ?? 'user',
        },
    });
};
