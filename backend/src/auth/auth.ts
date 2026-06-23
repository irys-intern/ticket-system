import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.ts";
import { userTable, sessionTable, accountTable, verificationTable } from "../db/schema.ts";
import { env } from "../config/env.ts";

export const auth = betterAuth({
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
        cookies: {
            session_token: {
                name: "sessionId",
                attributes: {
                    httpOnly: true,
                    sameSite: "none" as const,
                    secure: true,
                    path: "/",
                    maxAge: 60 * 60 * 24 * 3,
                },
            },
        },
    },
});
