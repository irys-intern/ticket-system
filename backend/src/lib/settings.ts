import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { appSettingsTable } from '../db/schema.ts';
import { getRedisSafe } from './redis.ts';
import { getOrSetCache, invalidateCache } from './cache.ts';

const SETTINGS_ROW_ID = 1;
export const SETTINGS_CACHE_KEY = 'app:settings';
const SETTINGS_CACHE_TTL_SECONDS = 30;

export const DEFAULT_SETTINGS = {
  siteIconUrl: '/favicon.svg',
  nlpDebounceMs: 600,
  dashboardCacheTtlSeconds: 60,
};

export type AppSettings = typeof DEFAULT_SETTINGS;

async function loadSettingsFromDb(): Promise<AppSettings> {
  const [row] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.id, SETTINGS_ROW_ID)).limit(1);
  if (!row) return DEFAULT_SETTINGS;
  return {
    siteIconUrl: row.siteIconUrl,
    nlpDebounceMs: row.nlpDebounceMs,
    dashboardCacheTtlSeconds: row.dashboardCacheTtlSeconds,
  };
}

export async function getSettings(): Promise<AppSettings> {
  return getOrSetCache(await getRedisSafe(), SETTINGS_CACHE_KEY, SETTINGS_CACHE_TTL_SECONDS, loadSettingsFromDb);
}

export async function updateSettings(patch: Partial<AppSettings>, updatedBy: string): Promise<AppSettings> {
  const current = await loadSettingsFromDb();
  const merged = { ...current, ...patch };

  await db
    .insert(appSettingsTable)
    .values({ id: SETTINGS_ROW_ID, ...merged, updatedBy, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettingsTable.id,
      set: { ...merged, updatedBy, updatedAt: new Date() },
    });

  await invalidateCache(await getRedisSafe(), SETTINGS_CACHE_KEY);
  return merged;
}
