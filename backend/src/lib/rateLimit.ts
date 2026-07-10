export interface RateLimitStore {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  ttl(key: string): Promise<number>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function checkRateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const count = await store.incr(key);
  if (count === 1) {
    await store.expire(key, windowSeconds);
  }

  if (count > limit) {
    const ttl = await store.ttl(key);
    return { allowed: false, remaining: 0, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
  }

  return { allowed: true, remaining: limit - count, retryAfterSeconds: 0 };
}
