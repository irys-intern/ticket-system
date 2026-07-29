import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    throw error(404, 'Not Found');
  }

  const sessionId = cookies.get('sessionId');
  const headers: Record<string, string> = sessionId ? { cookie: `sessionId=${sessionId}` } : {};

  let content = '';
  let errorMsg = '';
  try {
    const res = await fetch(`${backendUrl()}/training/${params.slug}`, { headers });
    if (!res.ok) {
      errorMsg = res.status === 404 ? 'Material not found.' : 'Failed to load material.';
    } else {
      const data = await res.json();
      content = data.content ?? '';
    }
  } catch {
    errorMsg = 'Failed to load material.';
  }

  return {
    slug: params.slug,
    content,
    errorMsg
  };
};
