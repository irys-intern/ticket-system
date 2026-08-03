import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    throw error(404, 'Not Found');
  }

  const token = cookies.get('authToken');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  let materials: { slug: string; title: string }[] = [];
  let errorMsg = '';
  try {
    const res = await fetch(`${backendUrl()}/training`, { headers });
    if (res.ok) {
      const data = await res.json();
      materials = data.materials ?? [];
    } else {
      errorMsg = 'Failed to load materials.';
    }
  } catch {
    errorMsg = 'Failed to load materials.';
  }

  return {
    materials,
    errorMsg
  };
};
