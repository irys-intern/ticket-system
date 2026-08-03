import { json, type RequestHandler } from '@sveltejs/kit';
import { auth } from '../../../auth/auth.ts';

export const POST: RequestHandler = async ({ request }) => {
    try {
        // signOut needs the incoming Authorization header (via the bearer plugin) or
        // cookie to know which session to revoke.
        await auth.api.signOut({
            headers: request.headers,
        });

        // There's no server-side token to clear when auth is bearer-token based --
        // the frontend just drops whatever it has stored client-side.
        return json({ success: true, message: 'Logout successful' }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ success: false, errors: [message] }, { status: 500 });
    }
};
