import { sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { getRedisClient } from './redis.ts';
import { env } from '../config/env.ts';

export interface HealthCheck {
  service: string;
  status: 'ok' | 'error';
  latencyMs?: number;
  message?: string;
}

async function timed(service: string, run: () => Promise<void>): Promise<HealthCheck> {
  const start = performance.now();
  try {
    await run();
    return { service, status: 'ok', latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    return { service, status: 'error', message: err instanceof Error ? err.message : 'Unreachable' };
  }
}

export async function checkSystemHealth(): Promise<HealthCheck[]> {
  return Promise.all([
    timed('database', async () => {
      await db.execute(sql`SELECT 1`);
    }),
    timed('redis', async () => {
      await (await getRedisClient()).ping();
    }),
    timed('nlp_service', async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(`${env.nlp.url}/health`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } finally {
        clearTimeout(timeout);
      }
    }),
  ]);
}
