import { json, type RequestHandler } from '@sveltejs/kit';
import { registerSchema } from '../../../utils/validators.ts';
import { auth } from '../../../auth/auth.ts';

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
        const fieldErrors = Object.values(parseResult.error.flatten().fieldErrors)
            .flat()
            .filter(Boolean);
        return json({ success: false, errors: fieldErrors }, { status: 400 });
    }

    const { name, email, password } = parseResult.data;

    try {
        const authResponse = await auth.api.signUpEmail({
            body: { name, email, password },
            asResponse: true,
        });

        if (!authResponse.ok) {
            if (authResponse.status === 422) {
                return json({ success: false, errors: ['Email is already registered'] }, { status: 409 });
            }
            const data = await authResponse.json().catch(() => ({}));
            const message = (data as { message?: string }).message || 'Registration failed';
            return json({ success: false, errors: [message] }, { status: authResponse.status });
        }

        return json({ success: true, message: 'Registration successful' }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ success: false, errors: [message] }, { status: 500 });
    }
};
