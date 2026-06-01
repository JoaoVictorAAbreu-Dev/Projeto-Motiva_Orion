const CACHE_NAME = 'motiva-orion-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.webmanifest'];
const API_ROUTES = [
  '/api/v1/trechos',
  '/api/v1/dashboard',
  '/api/v1/conformidade',
  '/api/v1/missoes',
  '/api/v1/config/regulatory-rules',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  const shouldCacheApi = API_ROUTES.some((route) => url.pathname.startsWith(route));

  if (shouldCacheApi) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (url.origin === self.location.origin) {
          const cloned = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return response;
      });
    })
  );
});
