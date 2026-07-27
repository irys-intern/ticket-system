import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { loginSchema } from '../../../utils/validators.ts';
import { auth } from '../../../auth/auth.ts';
import { db } from '../../../db/index.ts';
import { userTable } from '../../../db/schema.ts';

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

        // better-auth has no concept of our custom `active` flag, so a deactivated account
        // can still authenticate successfully -- reject it here before handing back a cookie.
        const [dbUser] = await db.select({ active: userTable.active }).from(userTable).where(eq(userTable.email, email)).limit(1);
        if (dbUser && !dbUser.active) {
            return json({ success: false, errors: ['This account has been deactivated.'] }, { status: 403 });
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
