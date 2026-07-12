import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { AuditEvent } from '../../../types/index.ts';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

function backendHeaders(cookies: Cookies, extra?: Record<string, string>) {
  const sessionId = cookies.get('sessionId');
  return { ...(sessionId ? { cookie: `sessionId=${sessionId}` } : {}), ...extra };
}

async function fetchAssignmentString(userId: string, cookies: Cookies) {
  try {
    const res = await fetch(`${backendUrl()}/admin/users/${userId}`, { headers: backendHeaders(cookies) });
    if (!res.ok) return '';
    const data = await res.json();
    return `${data.user.name} (${userId})`;
  } catch {
    return '';
  }
}

async function fetchAgents(cookies: Cookies) {
  try {
    const res = await fetch(`${backendUrl()}/admin/users`, { headers: backendHeaders(cookies) });
    if (!res.ok) return [];
    const allUsers = await res.json();
    const users = allUsers.users ?? [];
    return users.filter((u: { id: string; role: string; name: string }) => u.role === 'agent');
  } catch {
    return [];
  }
}

async function fetchAuditTrail(id: string, cookies: Cookies): Promise<AuditEvent[]> {
  try {
    const res = await fetch(`${backendUrl()}/admin/audit`, { headers: backendHeaders(cookies, { 'X-Ticket-Id': id }) });
    if (!res.ok) return [];
    const auditTrail: AuditEvent[] = (await res.json()).audits || [];
    for (const entry of auditTrail) {
      if (entry?.userId) {
        try {
          const r = await fetch(`${backendUrl()}/admin/users/${entry.userId}`, { headers: backendHeaders(cookies) });
          if (r.ok) {
            const j = await r.json();
            entry.userDisplay = `${j.user?.name ?? j.user?.username ?? 'User'} (${entry.userId})`;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return auditTrail;
  } catch {
    return [];
  }
}

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
  if (!locals.user) {
    redirect(307, '/auth/login');
  }

  const id = params.id;

  let ticket = null;
  let error: string | null = null;
  try {
    const res = await fetch(`${backendUrl()}/tickets/${id}`, { headers: backendHeaders(cookies) });
    if (!res.ok) throw new Error('Failed to fetch ticket');
    ticket = await res.json();
  } catch (err) {
    error = err instanceof Error ? err.message : 'An error occurred';
  }

  const assignmentString = ticket?.assignedTo ? await fetchAssignmentString(ticket.assignedTo, cookies) : '';
  const agents = locals.user.role === 'admin' ? await fetchAgents(cookies) : [];

  return {
    user: locals.user,
    ticket,
    error,
    assignmentString,
    agents,
    auditTrail: fetchAuditTrail(id, cookies)
  };
};
