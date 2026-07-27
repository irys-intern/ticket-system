import { db } from '../db/index.ts';
import { userTable } from '../db/schema.ts';

// Fixed, well-known ID for the placeholder account that historical records (tickets,
// comments, audit events, assignments) get reassigned to when their original user is
// deleted. It has no account/session row, so it can never log in.
export const DELETED_USER_ID = 'deleted-user';
export const DELETED_USER_NAME = '[deleted user]';

export async function ensureDeletedUserExists(): Promise<void> {
  await db
    .insert(userTable)
    .values({
      id: DELETED_USER_ID,
      name: DELETED_USER_NAME,
      email: 'deleted@system.invalid',
      emailVerified: false,
      role: 'user',
    })
    .onConflictDoNothing();
}
