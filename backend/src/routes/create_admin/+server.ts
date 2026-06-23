import { json, type RequestHandler } from '@sveltejs/kit';
import { randomUUID, scryptSync } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { usersTable } from '../../db/schema.ts';
import { registerSchema } from '../../utils/validators.ts';
import { env } from '../../config/env.ts';

const hashPassword = (password: string): string => {
  const salt = randomUUID();
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
};

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
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existingUser.length > 0) {
      return json({ success: false, errors: ['Email is already registered'] }, { status: 409 });
    }
    const passwordHash = hashPassword(password);
    await db.insert(usersTable).values({
      name,
      email,
      passwordHash,
      role: 'admin',
    });
    return json({ success: true, message: 'Admin registration successful' }, { status: 201 });
  }
    catch (error) {
    console.error('Admin registration error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return json({ success: false, errors: [message] }, { status: 500 });
  }
};