import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ locals }: RequestEvent) {
  const user = locals.user;

  return new Response(JSON.stringify({
    userRole: user?.role || 'guest',
    userName: user?.name || 'Guest User',
    userId: user?.userId || null
  }));
}