import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { userTable } from '../db/schema.ts';

function usage(): never {
  console.error('Usage: npm run create_admin -- <email>');
  process.exit(1);
}

async function main() {
  const [email] = process.argv.slice(2);
  if (!email) usage();

  const existing = await db.select({ id: userTable.id, role: userTable.role }).from(userTable).where(eq(userTable.email, email));
  if (existing.length === 0) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }
  if (existing[0].role === 'admin') {
    console.log(`${email} is already an admin`);
    process.exit(0);
  }

  await db.update(userTable).set({ role: 'admin' }).where(eq(userTable.id, existing[0].id));

  console.log(`Promoted ${email} to admin`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create admin:', err);
  process.exit(1);
});
