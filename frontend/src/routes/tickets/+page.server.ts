import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Ticket } from '../../types/index.ts';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

const sanitizePage = (raw: string | null) => {
  const page = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) {
    redirect(307, '/auth/login');
  }

  const sessionId = cookies.get('sessionId');
  const headers: Record<string, string> = sessionId ? { cookie: `sessionId=${sessionId}` } : {};

  // Only the admin branch of GET /tickets is paginated/searchable server-side --
  // user/agent ticket sets are already scoped to their own tickets.
  const isAdmin = locals.user.role === 'admin';
  const page = sanitizePage(url.searchParams.get('page'));
  const q = (url.searchParams.get('q') ?? '').slice(0, 200);
  const status = url.searchParams.get('status') ?? '';
  const limit = 20;

  const query = new URLSearchParams();
  if (isAdmin) {
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (q) query.set('q', q);
    if (status) query.set('status', status);
  }

  let tickets: Ticket[] = [];
  let errors: string[] = [];
  let total = 0;
  let totalPages = 1;
  try {
    const res = await fetch(`${backendUrl()}/tickets${isAdmin ? `?${query}` : ''}`, { headers });
    const data = await res.json();
    if (!res.ok) {
      errors = data.errors ?? [data.message ?? 'Unable to fetch tickets'];
    } else {
      tickets = data.tickets ?? [];
      total = data.total ?? tickets.length;
      totalPages = data.totalPages ?? 1;
    }
  } catch {
    errors = ['Unable to fetch tickets'];
  }

  let agentNames: Record<string, string> = {};
  if (isAdmin) {
    try {
      const res = await fetch(`${backendUrl()}/admin/users?limit=100`, { headers });
      if (res.ok) {
        const data = await res.json();
        agentNames = Object.fromEntries(
          (data.users ?? []).map((u: { id: string; name: string }) => [u.id, u.name])
        );
      }
    } catch {
      agentNames = {};
    }
  }

  return {
    userRole: locals.user.role,
    tickets,
    errors,
    agentNames,
    page,
    limit,
    total,
    totalPages,
    q,
    status
  };
};
