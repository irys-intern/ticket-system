import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

const client = postgres(env.database.url);
export const db = drizzle(client, { schema });

export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection
    await client`SELECT 1`;
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Failed to connect to database:', error);
    throw error;
  }
}

export { schema };
