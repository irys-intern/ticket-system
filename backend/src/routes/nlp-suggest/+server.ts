import { error, json, type RequestHandler } from '@sveltejs/kit';
import { env } from '../../config/env.ts';

const MAX_TEXT_LENGTH = 4000;

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user?.userId) {
    throw error(401, 'Unauthenticated');
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text.slice(0, MAX_TEXT_LENGTH) : '';
  if (!text.trim()) {
    return json({ priority: null, score: 0 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${env.nlp.url}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NLP-Api-Key': env.nlp.apiKey ?? '' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!res.ok) throw error(502, 'NLP service unavailable');
    return json(await res.json());
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    throw error(502, 'NLP service unavailable');
  } finally {
    clearTimeout(timeout);
  }
};
