import { json, type RequestHandler } from '@sveltejs/kit';
import { auth } from '../../../auth/auth.ts';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const authResponse = await auth.api.signOut({
            headers: request.headers,
            asResponse: true,
        });

        const response = json({ success: true, message: 'Logout successful' }, { status: 200 });
        const setCookie = authResponse.headers.get('set-cookie');
        if (setCookie) {
            response.headers.set('set-cookie', setCookie);
        }
        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ success: false, errors: [message] }, { status: 500 });
    }
};
