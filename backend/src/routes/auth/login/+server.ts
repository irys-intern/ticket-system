import { json, type RequestHandler } from '@sveltejs/kit';
import { loginSchema } from '../../../utils/validators.ts';
import { auth } from '../../../auth/auth.ts';

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
        const fieldErrors = Object.values(parseResult.error.flatten().fieldErrors)
            .flat()
            .filter(Boolean);
        return json({ success: false, errors: fieldErrors }, { status: 400 });
    }

    const { email, password } = parseResult.data;

    try {
        const authResponse = await auth.api.signInEmail({
            body: { email, password },
            asResponse: true,
        });

        if (!authResponse.ok) {
            return json({ success: false, errors: ['Invalid email or password'] }, { status: 401 });
        }

        const response = json({ success: true, message: 'Login successful' }, { status: 200 });
        const setCookie = authResponse.headers.get('set-cookie');
        if (setCookie) {
            response.headers.set('set-cookie', setCookie);
        }
        return response;
    } catch {
        return json({ success: false, errors: ['Invalid email or password'] }, { status: 401 });
    }
};
