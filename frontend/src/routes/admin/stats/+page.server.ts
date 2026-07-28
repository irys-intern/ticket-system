import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Ticket, User, AuditEvent } from '../../../types';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

// This page charts trends across the *entire* dataset, unlike the tickets/users/audit
// list pages which only ever need one page at a time. The backend endpoints are capped
// at 100 rows/request (see backend/src/utils/validators.ts), so fetch every page here
// -- server-to-server, admin-gated -- instead of asking the backend to special-case an
// unbounded response.
const MAX_PAGE_SIZE = 100;

async function fetchAllPages<T>(
  path: string,
  itemsKey: string,
  headers: Record<string, string>
): Promise<{ items: T[]; ok: boolean; errors?: string[] }> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetch(`${backendUrl()}${path}?page=${page}&limit=${MAX_PAGE_SIZE}`, { headers });
    const data = await res.json();
    if (!res.ok) {
      return { items, ok: false, errors: data.errors ?? [data.message ?? `Failed to load ${itemsKey}`] };
    }
    items.push(...(data[itemsKey] ?? []));
    totalPages = data.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return { items, ok: true };
}

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    redirect(307, '/auth/login');
  }

  const sessionId = cookies.get('sessionId');
  const headers: Record<string, string> = sessionId ? { cookie: `sessionId=${sessionId}` } : {};

  let tickets: Ticket[] = [];
  let users: User[] = [];
  let auditEvents: AuditEvent[] = [];
  let errors: string[] = [];

  const [ticketsResult, usersResult] = await Promise.all([
    fetchAllPages<Ticket>('/tickets', 'tickets', headers),
    fetchAllPages<User>('/admin/users', 'users', headers),
  ]);

  if (!ticketsResult.ok) {
    errors = ticketsResult.errors ?? ['Failed to load tickets'];
  } else if (!usersResult.ok) {
    errors = usersResult.errors ?? ['Failed to load users'];
  } else {
    tickets = ticketsResult.items;
    users = usersResult.items;
    const auditResult = await fetchAllPages<AuditEvent>('/admin/audit', 'events', headers);
    if (auditResult.ok) {
      auditEvents = auditResult.items;
    }
  }

  return {
    tickets,
    users,
    auditEvents,
    errors
  };
};
