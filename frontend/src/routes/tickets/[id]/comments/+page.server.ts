import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
  if (!locals.user) {
    redirect(307, '/auth/login');
  }

  const id = params.id;
  const token = cookies.get('authToken');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  let comments: { id: string; userName: string; createdAt: string; content: string; isAutomated: boolean }[] = [];
  let error: string | null = null;
  try {
    const res = await fetch(`${backendUrl()}/tickets/${id}/comments`, { headers });
    if (!res.ok) throw new Error('Failed to fetch comments. Please reload.');
    const data = await res.json();
    comments = data.comments ?? [];
  } catch (err) {
    error = err instanceof Error ? err.message : 'An error occurred';
  }

  let isClosed = false;
  try {
    const res = await fetch(`${backendUrl()}/tickets/${id}`, { headers });
    if (res.ok) {
      const ticket = await res.json();
      isClosed = ticket.status === 'closed';
    }
  } catch {
    isClosed = false;
  }

  return {
    ticketId: id,
    comments,
    error,
    isClosed
  };
};
