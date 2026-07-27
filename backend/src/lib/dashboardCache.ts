import { getSettings, SETTINGS_CACHE_KEY } from './settings.ts';
import { redis } from './redis.ts';
import { invalidateCache } from './cache.ts';

export const getDashboardCacheTtlSeconds = async () => (await getSettings()).dashboardCacheTtlSeconds;

export const DASHBOARD_TICKETS_CACHE_KEY = 'dashboard:tickets:admin';
export const DASHBOARD_USERS_CACHE_KEY = 'dashboard:users';
export const DASHBOARD_AUDIT_CACHE_KEY = 'dashboard:audit';

// Homepage "at a glance" stats (GET /), keyed per-user since the numbers differ by role/userId.
export const DASHBOARD_HOME_ADMIN_CACHE_KEY = 'dashboard:home:admin';
export const dashboardHomeUserCacheKey = (userId: string) => `dashboard:home:user:${userId}`;
export const dashboardHomeAgentCacheKey = (userId: string) => `dashboard:home:agent:${userId}`;

// Drops every cache entry this app writes -- the static keys above plus the
// per-user home keys, which aren't enumerable without a pattern scan.
export async function flushAllCaches(): Promise<number> {
  const staticKeys = [
    DASHBOARD_TICKETS_CACHE_KEY,
    DASHBOARD_USERS_CACHE_KEY,
    DASHBOARD_AUDIT_CACHE_KEY,
    DASHBOARD_HOME_ADMIN_CACHE_KEY,
    SETTINGS_CACHE_KEY,
  ];
  const dynamicKeys = await redis.keys('dashboard:home:*');
  const allKeys = [...new Set([...staticKeys, ...dynamicKeys])];
  if (allKeys.length === 0) return 0;
  await invalidateCache(redis, ...allKeys);
  return allKeys.length;
}
