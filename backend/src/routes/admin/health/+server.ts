import { error, json, type RequestHandler } from '@sveltejs/kit';
import { checkSystemHealth } from '../../../lib/health.ts';

export const GET: RequestHandler = async ({ locals }) => {
  if (locals.user?.role !== 'admin') {
    throw error(401, 'Unauthenticated');
  }
  const checks = await checkSystemHealth();
  return json({ checks });
};
