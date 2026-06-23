import { initializeDatabase, db } from './db/index.ts';
import { auth } from './auth/auth.ts';
import { userTable } from './db/schema.ts';
import { eq } from 'drizzle-orm';

await initializeDatabase();

export async function handle({ event, resolve }) {
    const origin = event.request.headers.get('origin') ?? '*';
    const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ticket-Id',
        'Access-Control-Allow-Credentials': 'true',
    };

    if (event.request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const session = await auth.api.getSession({
        headers: event.request.headers,
    });

    if (session) {
        const [dbUser] = await db
            .select({ role: userTable.role })
            .from(userTable)
            .where(eq(userTable.id, session.user.id));
        event.locals.session = {
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: dbUser?.role ?? 'user',
        };
    } else {
        event.locals.session = null;
    }
    event.locals.user = event.locals.session;

    const response = await resolve(event);
    for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
    }
    return response;
}
