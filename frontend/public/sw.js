// Service Worker — Tuong Mask Gallery
// Caches static assets and images for offline and fast repeat visits

const CACHE_NAME = 'tuong-mask-v1';
const PRECACHE_URLS = [
  '/',
  '/site.webmanifest',
  '/favicon.svg',
  '/logo_tuong.png',
];

// Install: pre-cache the shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Static assets (wasm, models, images): Cache-first (immutable)
// - API calls: Network-first with cache fallback
// - Everything else: Stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls — always network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for immutable assets (images, wasm, models)
  const isImmutable =
    url.pathname.startsWith('/static/images/') ||
    url.pathname.startsWith('/models/') ||
    url.pathname.startsWith('/try-on/') ||
    url.pathname.startsWith('/assets/');

  if (isImmutable) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        });
        return cached || networkFetch;
      })
    )
  );
});
