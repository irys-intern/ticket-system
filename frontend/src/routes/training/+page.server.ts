import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const sessionId = cookies.get('sessionId');
  const backendUrl = env.BACKEND_URL ?? 'http://localhost:5172';

  let materials: { slug: string; title: string }[] = [];
  let errorMsg = '';

  if (sessionId) {
    try {
      const res = await fetch(`${backendUrl}/training`, { headers: { cookie: `sessionId=${sessionId}` } });
      if (res.ok) {
        const data = await res.json();
        materials = data.materials ?? [];
      } else {
        errorMsg = 'Failed to load training materials.';
      }
    } catch {
      errorMsg = 'Failed to load training materials.';
    }
  } else {
    errorMsg = 'Failed to load training materials.';
  }

  return {
    userRole: locals.user?.role ?? '',
    materials,
    errorMsg
  };
};
