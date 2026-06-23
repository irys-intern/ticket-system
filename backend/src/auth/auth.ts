import {betterAuth} from "better-auth";

export const auth = betterAuth({
    secret: process.env.AUTH_SECRET || 'default_secret',
    cookieName: 'sessionId',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 3,
        updateAge: 60 * 60 * 24,
    }
});