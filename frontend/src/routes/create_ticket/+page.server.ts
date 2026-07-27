import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

export const load: PageServerLoad = async () => {
  let nlpDebounceMs = 600;
  try {
    const res = await fetch(`${backendUrl()}/settings`);
    if (res.ok) {
      const data = await res.json();
      nlpDebounceMs = data.nlpDebounceMs ?? nlpDebounceMs;
    }
  } catch {
    // fall back to the default debounce if the backend/settings are unreachable
  }
  return { nlpDebounceMs };
};
