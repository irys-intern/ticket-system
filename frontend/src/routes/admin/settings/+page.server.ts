import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    redirect(307, '/auth/login');
  }

  const sessionId = cookies.get('sessionId');
  const headers: Record<string, string> = sessionId ? { cookie: `sessionId=${sessionId}` } : {};

  let settings = { siteIconUrl: '/favicon.svg', nlpDebounceMs: 600, dashboardCacheTtlSeconds: 60 };
  let error: string | null = null;
  try {
    const res = await fetch(`${backendUrl()}/admin/settings`, { headers });
    const data = await res.json();
    if (!res.ok) {
      error = data.message ?? 'Unable to fetch settings';
    } else {
      settings = data.settings;
    }
  } catch {
    error = 'Unable to fetch settings';
  }

  return { settings, error };
};
