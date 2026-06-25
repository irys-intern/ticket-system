import { createClient } from 'redis';
import { env } from '../config/env.ts';

export const redis = createClient({ url: env.redis.url });

redis.on('error', (err) => console.error('Redis error:', err));

await redis.connect();
