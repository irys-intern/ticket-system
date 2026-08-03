import { createClient } from 'redis';
import { env } from '../config/env.ts';

let Redis: ReturnType<typeof createClient> | null = null;
let connecting = false;

export const getRedisClient = async () => {
  if (Redis) return Redis;
  if (connecting) {
    // Wait for the existing connection attempt to finish
    while (connecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return Redis!;
  }
  connecting = true;
  Redis = createClient({ url: env.redis.url });
  Redis.on('error', (err) => console.error('Redis error:', err));
  await Redis.connect();
  connecting = false;
  return Redis;
}
export async function getRedisSafe() {
  try {
    return await getRedisClient();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    return null;
  }
}