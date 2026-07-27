export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX: number }): Promise<unknown>;
  del(keys: string | string[]): Promise<number>;
}

export async function getOrSetCache<T>(
  store: CacheStore,
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await store.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    // Fail open: if Redis is unavailable, fall through to the DB rather than 500ing.
    console.error(`Cache read failed for ${key}, falling back to DB:`, err);
  }

  const value = await compute();

  try {
    await store.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.error(`Cache write failed for ${key}:`, err);
  }

  return value;
}

export async function invalidateCache(store: CacheStore, ...keys: string[]): Promise<void> {
  try {
    await store.del(keys);
  } catch (err) {
    console.error(`Cache invalidation failed for ${keys.join(', ')}:`, err);
  }
}
