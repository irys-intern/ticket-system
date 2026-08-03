import { createClient } from 'redis';
import { env } from '../config/env.ts';

console.log('Connecting to Redis at', env.redis.url.replace(/:[^:@/]+@/, ':***@'));
console.log(
  'Env keys containing REDIS:',
  JSON.stringify(Object.keys(process.env).filter((k) => k.toUpperCase().includes('REDIS'))),
);

export const redis = createClient({ url: env.redis.url });

redis.on('error', (err) => console.error('Redis error:', err));

await redis.connect();
