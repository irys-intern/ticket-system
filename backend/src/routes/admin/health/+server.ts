import { error, json, type RequestHandler } from '@sveltejs/kit';
import { checkSystemHealth } from '../../../lib/health.ts';

export const GET: RequestHandler = async ({ locals }) => {
  if (locals.user?.role !== 'admin') {
    throw error(404, 'Not Found');
  }
  const checks = await checkSystemHealth();
  return json({ checks });
};
