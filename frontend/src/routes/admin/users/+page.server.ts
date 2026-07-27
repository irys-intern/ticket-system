import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    redirect(307, '/auth/login');
  }

  const sessionId = cookies.get('sessionId');
  const headers: Record<string, string> = sessionId ? { cookie: `sessionId=${sessionId}` } : {};

  let users: { id: string; name: string; email: string; role: string; active: boolean }[] = [];
  let errors: string[] = [];
  try {
    const res = await fetch(`${backendUrl()}/admin/users`, { headers });
    const data = await res.json();
    if (!res.ok) {
      errors = data.errors ?? [data.message ?? 'Unable to fetch users'];
    } else {
      users = data.users ?? [];
    }
  } catch {
    errors = ['Unable to fetch users'];
  }

  return {
    users,
    errors,
    currentUserId: locals.user.userId
  };
};
