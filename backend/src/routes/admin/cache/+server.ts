import { error, json, type RequestHandler } from '@sveltejs/kit';
import { flushAllCaches } from '../../../lib/dashboardCache.ts';

export const DELETE: RequestHandler = async ({ locals }) => {
  if (locals.user?.role !== 'admin') {
    throw error(401, 'Unauthenticated');
  }
  const cleared = await flushAllCaches();
  return json({ cleared });
};
