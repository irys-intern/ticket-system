import { initializeDatabase, db } from './db/index.ts';
import { auth } from './auth/auth.ts';
import { userTable } from './db/schema.ts';
import { eq } from 'drizzle-orm';
import { redis } from './lib/redis.ts';
import { checkRateLimit } from './lib/rateLimit.ts';

await initializeDatabase();

// Stricter limits on unauthenticated, abuse-prone endpoints; a looser default elsewhere.
const RATE_LIMIT_RULES: { pattern: RegExp; limit: number; windowSeconds: number }[] = [
    { pattern: /^\/auth\/(login|register)$/, limit: 10, windowSeconds: 10 },
    { pattern: /^\/create_ticket$/, limit: 30, windowSeconds: 60 },
];

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

    const rule = RATE_LIMIT_RULES.find((r) => r.pattern.test(event.url.pathname));
    if (rule) {
        const ip = event.getClientAddress();
        const key = `ratelimit:${event.url.pathname}:${ip}`;
        try {
            const result = await checkRateLimit(redis, key, rule.limit, rule.windowSeconds);
            if (!result.allowed) {
                return new Response(
                    JSON.stringify({ success: false, errors: ['Too many requests, please try again later'] }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'Retry-After': String(result.retryAfterSeconds),
                            ...corsHeaders,
                        },
                    },
                );
            }
        } catch (err) {
            // Fail open: if Redis is unavailable, skip rate limiting rather than 500ing every request.
            console.error('Rate limit check failed, allowing request:', err);
        }
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
