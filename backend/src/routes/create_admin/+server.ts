import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { userTable } from '../../db/schema.ts';
import { registerSchema } from '../../utils/validators.ts';
import { auth } from '../../auth/auth.ts';
import { env } from '../../config/env.ts';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const parseResult = registerSchema.safeParse(body);
        if (!parseResult.success) {
            const fieldErrors = Object.values(parseResult.error.flatten().fieldErrors)
                .flat()
                .filter(Boolean);
            return json({ success: false, errors: fieldErrors }, { status: 400 });
        }

        const { name, email, password } = parseResult.data;

        if (env.superPassword && password !== env.superPassword) {
            return json({ success: false, errors: ['Invalid super password'] }, { status: 403 });
        }

        const existing = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, email));
        if (existing.length > 0) {
            return json({ success: false, errors: ['Email is already registered'] }, { status: 409 });
        }

        const result = await auth.api.signUpEmail({
            body: { name, email, password },
        });

        await db.update(userTable).set({ role: 'admin' }).where(eq(userTable.id, result.user.id));

        return json({ success: true, message: 'Admin registration successful' }, { status: 201 });
    } catch (error) {
        console.error('Admin registration error:', error);
        const message = error instanceof Error ? error.message : String(error);
        return json({ success: false, errors: [message] }, { status: 500 });
    }
};
