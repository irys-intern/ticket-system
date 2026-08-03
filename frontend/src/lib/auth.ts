import { dev } from '$app/environment';

// Frontend and backend are on unrelated Railway subdomains, so a cookie set by the
// backend is cross-site and unreliable across browsers (see backend/src/auth/auth.ts).
// The backend hands back the session token as a plain header instead; it's stored here
// in two places: localStorage for client-side fetches, and a first-party cookie (on the
// frontend's own domain, so it's not cross-site) that SSR load functions can read via
// `cookies.get()` and forward to the backend themselves.
const TOKEN_KEY = 'authToken';

export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  const secure = dev ? '' : '; Secure';
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 3}; SameSite=Lax${secure}`;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
