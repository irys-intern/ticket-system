import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Ticket, User, AuditEvent } from '../../../types';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

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

  const [ticketsRes, usersRes, auditRes] = await Promise.all([
    fetch(`${backendUrl()}/tickets`, { headers }),
    fetch(`${backendUrl()}/admin/users`, { headers }),
    fetch(`${backendUrl()}/admin/audit`, { headers }),
  ]);

  const ticketsData = await ticketsRes.json();
  const usersData = await usersRes.json();

  if (!ticketsRes.ok) {
    errors = ticketsData.errors ?? ['Failed to load tickets'];
  } else if (!usersRes.ok) {
    errors = usersData.errors ?? ['Failed to load users'];
  } else {
    tickets = ticketsData.tickets ?? [];
    users = usersData.users ?? [];
    if (auditRes.ok) {
      const auditData = await auditRes.json();
      auditEvents = auditData.events ?? [];
    }
  }

  return {
    tickets,
    users,
    auditEvents,
    errors
  };
};
