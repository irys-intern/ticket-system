import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Ticket } from '../../types/index.ts';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) {
    redirect(307, '/auth/login');
  }

  const sessionId = cookies.get('sessionId');
  const headers: Record<string, string> = sessionId ? { cookie: `sessionId=${sessionId}` } : {};

  let tickets: Ticket[] = [];
  let errors: string[] = [];
  try {
    const res = await fetch(`${backendUrl()}/tickets`, { headers });
    const data = await res.json();
    if (!res.ok) {
      errors = data.errors ?? [data.message ?? 'Unable to fetch tickets'];
    } else {
      tickets = data.tickets ?? [];
    }
  } catch {
    errors = ['Unable to fetch tickets'];
  }

  let agentNames: Record<string, string> = {};
  if (locals.user.role === 'admin') {
    try {
      const res = await fetch(`${backendUrl()}/admin/users`, { headers });
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
    agentNames
  };
};
