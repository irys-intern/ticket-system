import { createClient } from 'redis';
import { env } from '../config/env.ts';

console.log('Connecting to Redis at', env.redis.url.replace(/:[^:@/]+@/, ':***@'));
console.log(
  'Env keys containing REDIS:',
  JSON.stringify(Object.keys(process.env).filter((k) => k.toUpperCase().includes('REDIS'))),
);
console.log('FOO_TEST:', process.env.FOO_TEST);
console.log('Total env var count:', Object.keys(process.env).length);
console.log('All env keys:', JSON.stringify(Object.keys(process.env).sort()));

export const redis = createClient({ url: env.redis.url });

redis.on('error', (err) => console.error('Redis error:', err));

await redis.connect();
