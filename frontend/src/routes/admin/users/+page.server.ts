import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

// Query params come straight from the browser -- clamp/whitelist rather than
// trusting them, even though the backend re-validates independently.
const sanitizePage = (raw: string | null) => {
  const page = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    throw error(404, 'Not Found');
  }

  const sessionId = cookies.get('sessionId');
  const headers: Record<string, string> = sessionId ? { cookie: `sessionId=${sessionId}` } : {};

  const page = sanitizePage(url.searchParams.get('page'));
  const q = (url.searchParams.get('q') ?? '').slice(0, 200);
  const limit = 20;

  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) query.set('q', q);

  let users: { id: string; name: string; email: string; role: string; active: boolean }[] = [];
  let errors: string[] = [];
  let total = 0;
  let totalPages = 1;
  try {
    const res = await fetch(`${backendUrl()}/admin/users?${query}`, { headers });
    const data = await res.json();
    if (!res.ok) {
      errors = data.errors ?? [data.message ?? 'Unable to fetch users'];
    } else {
      users = data.users ?? [];
      total = data.total ?? users.length;
      totalPages = data.totalPages ?? 1;
    }
  } catch {
    errors = ['Unable to fetch users'];
  }

  return {
    users,
    errors,
    currentUserId: locals.user.userId,
    page,
    limit,
    total,
    totalPages,
    q
  };
};
