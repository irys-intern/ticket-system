import { initializeDatabase } from './db/index.ts';

// Initialize database on server start
await initializeDatabase();
