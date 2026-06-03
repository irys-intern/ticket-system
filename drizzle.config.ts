import { defineConfig } from 'drizzle-kit';
import 'dotenv/config'; // Make sure you have dotenv installed

export default defineConfig({
  schema: './src/db/schema.ts', // Update to your schema path
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL
  },
  verbose: true,
  strict: true,
});
