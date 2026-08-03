import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.ts";
import { userTable, sessionTable, accountTable, verificationTable } from "../db/schema.ts";
import { env } from "../config/env.ts";
import { getRedisClient } from "../lib/redis.ts";

export const auth = betterAuth({
    secondaryStorage: {
        get: async (key) => (await getRedisClient()).get(key),
        set: async (key, value, ttl) => {
            const redis = await getRedisClient();
            return ttl ? redis.set(key, value, { EX: ttl }) : redis.set(key, value);
        },
        delete: async (key) => {
            await (await getRedisClient()).del(key);
        },
    },
    secret: env.auth.secret,
    baseURL: env.backend.url,
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: userTable,
            session: sessionTable,
            account: accountTable,
            verification: verificationTable,
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user",
                required: false,
            },
        },
    },
    advanced: {
        // Firefox requires the __Host- prefix for Partitioned cookies (Chrome only
        // recommends it). better-auth's automatic HTTPS-detected prefix is always
        // __Secure-, so useSecureCookies is disabled here and __Host- is applied
        // to the name directly instead.
        useSecureCookies: false,
        cookies: {
            session_token: {
                name: "__Host-sessionId",
                attributes: {
                    httpOnly: true,
                    sameSite: "none" as const,
                    secure: true,
                    partitioned: true,
                    path: "/",
                    maxAge: 60 * 60 * 24 * 3,
                },
            },
        },
    },
});
