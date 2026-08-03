import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { AuditEvent, User } from '../../../types/index.ts';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

const sanitizePage = (raw: string | null) => {
  const page = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    throw error(404, 'Not Found');
  }

  const token = cookies.get('authToken');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const page = sanitizePage(url.searchParams.get('page'));
  const q = (url.searchParams.get('q') ?? '').slice(0, 200);
  const action = url.searchParams.get('action') ?? '';
  const limit = 25;

  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) query.set('q', q);
  if (action) query.set('action', action);

  let events: AuditEvent[] = [];
  let users: User[] = [];
  let total = 0;
  let totalPages = 1;
  try {
    const res = await fetch(`${backendUrl()}/admin/audit?${query}`, { headers });
    const data = await res.json();
    if (res.ok) {
      events = data.events ?? [];
      users = data.users ?? [];
      total = data.total ?? events.length;
      totalPages = data.totalPages ?? 1;
    }
  } catch {
    events = [];
    users = [];
  }

  return {
    events,
    users,
    page,
    limit,
    total,
    totalPages,
    q,
    action
  };
};
