import { getSettings, SETTINGS_CACHE_KEY } from './settings.ts';
import { redis } from './redis.ts';
import { invalidateCache } from './cache.ts';

export const getDashboardCacheTtlSeconds = async () => (await getSettings()).dashboardCacheTtlSeconds;

// Homepage "at a glance" stats (GET /), keyed per-user since the numbers differ by role/userId.
// The paginated admin list endpoints (tickets/users/audit) are queried straight from the DB
// instead of cached -- their key space is unbounded once page/limit/search params are involved,
// and a single indexed LIMIT/OFFSET query is already cheap.
export const DASHBOARD_HOME_ADMIN_CACHE_KEY = 'dashboard:home:admin';
export const dashboardHomeUserCacheKey = (userId: string) => `dashboard:home:user:${userId}`;
export const dashboardHomeAgentCacheKey = (userId: string) => `dashboard:home:agent:${userId}`;

// Drops every cache entry this app writes -- the static keys above plus the
// per-user home keys, which aren't enumerable without a pattern scan.
export async function flushAllCaches(): Promise<number> {
  const dynamicKeys = await redis.keys('dashboard:home:*');
  const allKeys = [...new Set([DASHBOARD_HOME_ADMIN_CACHE_KEY, SETTINGS_CACHE_KEY, ...dynamicKeys])];
  await invalidateCache(redis, ...allKeys);
  return allKeys.length;
}
