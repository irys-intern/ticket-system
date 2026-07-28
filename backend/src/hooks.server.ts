import { initializeDatabase, db } from './db/index.ts';
import { auth } from './auth/auth.ts';
import { userTable } from './db/schema.ts';
import { eq } from 'drizzle-orm';
import { redis } from './lib/redis.ts';
import { checkRateLimit } from './lib/rateLimit.ts';
import { env } from './config/env.ts';
import type { Handle } from '@sveltejs/kit';

await initializeDatabase();

// Stricter limits on unauthenticated, abuse-prone endpoints; a looser default elsewhere.
const RATE_LIMIT_RULES: { pattern: RegExp; limit: number; windowSeconds: number }[] = [
    { pattern: /^\/auth\/(login|register)$/, limit: 10, windowSeconds: 10 },
    { pattern: /^\/create_ticket$/, limit: 30, windowSeconds: 60 },
    { pattern: /^\/nlp-suggest$/, limit: 20, windowSeconds: 60 },
];

// Only the configured frontend is allowed to make credentialed requests; reflecting
// arbitrary Origin headers here would let any site read authenticated responses.
const ALLOWED_ORIGINS = new Set([env.frontend.url]);

export const handle: Handle = async ({ event, resolve }) => {
    const origin = event.request.headers.get('origin');
    const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : null;
    const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ticket-Id',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin',
    };
    if (allowedOrigin) {
        corsHeaders['Access-Control-Allow-Origin'] = allowedOrigin;
    }

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
            .select({ role: userTable.role, active: userTable.active })
            .from(userTable)
            .where(eq(userTable.id, session.user.id));
        // A deactivated account keeps its session row, but is treated as logged out on
        // every subsequent request rather than having its session forcibly revoked.
        event.locals.session = dbUser && !dbUser.active ? null : {
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
