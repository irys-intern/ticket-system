import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { AuditEvent, User } from '../../../types/index.ts';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    redirect(307, '/auth/login');
  }

  const sessionId = cookies.get('sessionId');
  const headers: Record<string, string> = sessionId ? { cookie: `sessionId=${sessionId}` } : {};

  let events: AuditEvent[] = [];
  let users: User[] = [];
  try {
    const res = await fetch(`${backendUrl()}/admin/audit`, { headers });
    const data = await res.json();
    if (res.ok) {
      events = (data.events ?? []).sort((a: { id: string }, b: { id: string }) => Number(b.id) - Number(a.id));
      users = data.users ?? [];
    }
  } catch {
    events = [];
    users = [];
  }

  return {
    events,
    users
  };
};
