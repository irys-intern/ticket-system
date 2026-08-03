import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
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
    // Frontend and backend are on unrelated Railway subdomains (different sites, not just
    // different subdomains of one domain), so a session cookie is a cross-site cookie
    // that's fundamentally unreliable across browsers (Firefox in particular won't store
    // it even with SameSite=None + Partitioned/CHIPS set correctly). The bearer plugin
    // sidesteps this: the frontend gets the session token back as a plain `set-auth-token`
    // response header (not a cookie) and sends it back as `Authorization: Bearer <token>`,
    // which isn't subject to any same-site/third-party cookie policy at all.
    plugins: [bearer()],
});
