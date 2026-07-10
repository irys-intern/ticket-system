import { describe, it, expect } from 'vitest';
import { checkRateLimit, type RateLimitStore } from './rateLimit.ts';

function createFakeStore(): RateLimitStore & { counts: Map<string, number> } {
  const counts = new Map<string, number>();
  const ttls = new Map<string, number>();
  return {
    counts,
    async incr(key) {
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    },
    async expire(key, seconds) {
      ttls.set(key, seconds);
      return true;
    },
    async ttl(key) {
      return ttls.get(key) ?? -1;
    },
  };
}

describe('checkRateLimit', () => {
  it('allows requests under the limit', async () => {
    const store = createFakeStore();
    const result = await checkRateLimit(store, 'k', 3, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('allows exactly up to the limit', async () => {
    const store = createFakeStore();
    await checkRateLimit(store, 'k', 2, 60);
    const result = await checkRateLimit(store, 'k', 2, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('rejects requests once the limit is exceeded', async () => {
    const store = createFakeStore();
    await checkRateLimit(store, 'k', 1, 60);
    const result = await checkRateLimit(store, 'k', 1, 60);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('tracks separate keys independently', async () => {
    const store = createFakeStore();
    await checkRateLimit(store, 'a', 1, 60);
    const result = await checkRateLimit(store, 'b', 1, 60);
    expect(result.allowed).toBe(true);
  });

  it('sets an expiry only on the first increment', async () => {
    const store = createFakeStore();
    await checkRateLimit(store, 'k', 5, 60);
    await checkRateLimit(store, 'k', 5, 60);
    expect(await store.ttl('k')).toBe(60);
  });

  it('propagates a store failure to the caller (caller is responsible for failing open)', async () => {
    const failingStore: RateLimitStore = {
      incr: async () => {
        throw new Error('connection lost');
      },
      expire: async () => undefined,
      ttl: async () => -1,
    };
    await expect(checkRateLimit(failingStore, 'k', 5, 60)).rejects.toThrow('connection lost');
  });
});
