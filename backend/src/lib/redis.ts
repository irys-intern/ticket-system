import { createClient } from 'redis';
import { env } from '../config/env.ts';

console.log('Connecting to Redis at', env.redis.url.replace(/:[^:@/]+@/, ':***@'));

export const redis = createClient({ url: env.redis.url });

redis.on('error', (err) => console.error('Redis error:', err));

await redis.connect();
