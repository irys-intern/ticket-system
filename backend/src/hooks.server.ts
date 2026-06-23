import { initializeDatabase } from './db/index.ts';
import { validateSession } from './middleware/sessionValidator.ts'

// Initialize database on server start
await initializeDatabase();

export async function handle({ event, resolve }) {
    const origin = event.request.headers.get('origin') ?? '*';
    const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };

    if (event.request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const session = await validateSession(event);
    event.locals.session = session;
    event.locals.user = session ? {
        userId: session.userId,
        email: session.email,
        name: session.name,
        role: session.role
    } : null;

    const response = await resolve(event);
    for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
    }
    return response;
}