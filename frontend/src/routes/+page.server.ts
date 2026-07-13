import type { Cookies } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

const statsDefaults = {
  openTicketsUser: [] as unknown[],
  resolvedTicketsUser: [] as unknown[],
  closedTicketsUser: [] as unknown[],
  progressTicketsUser: [] as unknown[],
  assignedAgentTickets: [] as unknown[],
  adminTotal: 0,
  adminOpen: 0,
  adminUsers: 0
};

async function fetchStats(cookies: Cookies) {
  const sessionId = cookies.get('sessionId');
  if (!sessionId) {
    return statsDefaults;
  }

  const backendUrl = env.BACKEND_URL ?? 'http://localhost:5172';

  let res: Response;
  try {
    res = await fetch(backendUrl, { headers: { cookie: `sessionId=${sessionId}` } });
  } catch {
    return statsDefaults;
  }

  if (!res.ok) {
    return statsDefaults;
  }

  const data = await res.json();
  return {
    openTicketsUser: data.openTicketsUser || [],
    resolvedTicketsUser: data.resolvedTicketsUser || [],
    closedTicketsUser: data.closedTicketsUser || [],
    progressTicketsUser: data.progressTicketsUser || [],
    assignedAgentTickets: data.assignedAgentTickets || [],
    adminTotal: data.adminTotal ?? 0,
    adminOpen: data.adminOpen ?? 0,
    adminUsers: data.adminUsers ?? 0
  };
}

export const load: PageServerLoad = async ({ locals, cookies }) => {
  return {
    userRole: locals.user?.role || 'guest',
    userName: locals.user?.name || 'Guest User',
    stats: fetchStats(cookies)
  };
};
