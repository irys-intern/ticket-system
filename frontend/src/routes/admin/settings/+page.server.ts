import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    throw error(404, 'Not Found');
  }

  const token = cookies.get('authToken');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  let settings = { siteIconUrl: '/favicon.svg', nlpDebounceMs: 600, dashboardCacheTtlSeconds: 60 };
  let settingsError: string | null = null;
  try {
    const res = await fetch(`${backendUrl()}/admin/settings`, { headers });
    const data = await res.json();
    if (!res.ok) {
      settingsError = data.message ?? 'Unable to fetch settings';
    } else {
      settings = data.settings;
    }
  } catch {
    settingsError = 'Unable to fetch settings';
  }

  return { settings, error: settingsError };
};
