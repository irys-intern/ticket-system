import { json, type RequestHandler } from '@sveltejs/kit';
import { scryptSync } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.ts';
import { usersTable } from '../../../db/schema.ts';
import { loginSchema } from '../../../utils/validators.ts';
import { sessionStore } from '../../../auth/redis-session.ts';

let successfulLogin = false;

const verifyPassword = (password: string, storedHash: string): boolean => {
  const [salt, derivedKey] = storedHash.split(':');
  const hashToCompare = scryptSync(password, salt, 64).toString('hex');
  return hashToCompare === derivedKey;
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors = Object.values(parseResult.error.flatten().fieldErrors)
        .flat()
        .filter(Boolean);
    return json({ success: false, errors: fieldErrors }, { status: 400 });
    }

    const { email, password } = parseResult.data;

    const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);
    
    if (user.length === 0) {
        successfulLogin = false;
        // Do not return immediately to prevent timing attacks
    } else {
        const storedHash = user[0].passwordHash;
        successfulLogin = verifyPassword(password, storedHash);
    }

    if (!successfulLogin) {
      return json({ success: false, errors: ['Invalid email or password'] }, { status: 401 });
    }
    const sessionToken = await sessionStore.createSession(user[0].id.toString(), user[0].email, user[0].name, user[0].role, 60 * 60 * 24);
    cookies.set('sessionId', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 24,
        path: '/',
    });
    return json({ success: true, message: 'Login successful' }, { status: 200 });
    } catch (error) {
        console.error('Login error:', error);
        const message = error instanceof Error ? error.message : String(error);
        return json({ success: false, errors: [message] }, { status: 500 });
    }
};