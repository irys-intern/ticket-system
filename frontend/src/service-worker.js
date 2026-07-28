/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;

// The app shell (JS/CSS bundle + static assets) plus a standalone offline
// fallback page, precached on install so a lost connection can still render
// something better than the browser's default network-error screen.
const ASSETS = [...build, ...files, '/offline.html'];

self.addEventListener('install', (event) => {
	// Cache each asset independently rather than via cache.addAll(), which is
	// all-or-nothing -- one bad entry (redirect, transient 404, opaque
	// response) would otherwise silently prevent every asset, including the
	// offline fallback itself, from ever getting cached.
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		for (const asset of ASSETS) {
			try {
				const response = await fetch(asset, { cache: 'no-store' });
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				await cache.put(asset, response);
			} catch (err) {
				console.error('Service worker failed to precache', asset, err);
			}
		}
	}
	event.waitUntil(addFilesToCache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}
	event.waitUntil(deleteOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	// Only handle requests to this app's own origin -- API calls to the
	// backend (a different origin/port) pass through untouched so this
	// worker never intercepts or mis-caches authenticated responses.
	if (url.origin !== self.location.origin) return;

	async function respond() {
		const cache = await caches.open(CACHE);

		if (ASSETS.includes(url.pathname)) {
			const cached = await cache.match(url.pathname);
			if (cached) return cached;
		}

		try {
			// Navigations must hit the real network, not the browser's own HTTP
			// cache -- a disk-cache hit needs no connectivity, so without this a
			// "reload while offline" can silently succeed and never reach the
			// catch block below where the offline fallback actually lives.
			const request =
				event.request.mode === 'navigate' ? new Request(event.request, { cache: 'no-store' }) : event.request;
			const response = await fetch(request);
			if (response.ok && ASSETS.includes(url.pathname)) {
				cache.put(event.request, response.clone());
			}
			return response;
		} catch (err) {
			const cached = await cache.match(event.request);
			if (cached) return cached;
			if (event.request.mode === 'navigate') {
				const offline = await cache.match('/offline.html');
				if (offline) return offline;
			}
			throw err;
		}
	}

	event.respondWith(respond());
});
