import { defineConfig } from 'drizzle-kit';
import 'dotenv/config'; // Make sure you have dotenv installed

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export default defineConfig({
  schema: './src/db/schema.ts', // Update to your schema path
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
