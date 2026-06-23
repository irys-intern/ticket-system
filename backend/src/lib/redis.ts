import { createClient } from 'redis';
import { env } from '../config/env.ts';

export const client = createClient({
    url: env.redis.url,
});

client.on('error', (err) => {
    console.error('Redis Client Error', err);
});
client.on('connect', () => {
    console.log('✓ Connected to Redis successfully');
});

await client.connect();
export const redis = client;