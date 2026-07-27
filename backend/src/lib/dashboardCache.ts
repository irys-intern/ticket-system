import { getSettings } from './settings.ts';

export const getDashboardCacheTtlSeconds = async () => (await getSettings()).dashboardCacheTtlSeconds;

export const DASHBOARD_TICKETS_CACHE_KEY = 'dashboard:tickets:admin';
export const DASHBOARD_USERS_CACHE_KEY = 'dashboard:users';
export const DASHBOARD_AUDIT_CACHE_KEY = 'dashboard:audit';

// Homepage "at a glance" stats (GET /), keyed per-user since the numbers differ by role/userId.
export const DASHBOARD_HOME_ADMIN_CACHE_KEY = 'dashboard:home:admin';
export const dashboardHomeUserCacheKey = (userId: string) => `dashboard:home:user:${userId}`;
export const dashboardHomeAgentCacheKey = (userId: string) => `dashboard:home:agent:${userId}`;
