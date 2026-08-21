// TFL-CONTINUITY: this service worker is a browser-local cache only. It never
// uploads, syncs, merges, or recovers accounts; progress moves between
// browsers only through the explicit export/import the person chooses.
const CACHE_NAME = 'learningquest-static-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './questions.json',
  './manifest.webmanifest',
  './content-packs/registry.json',
  './content-packs/hk-chinese-basics.json',
  './content-packs/mandarin-basics.json',
  './content-packs/maths-foundation.json',
  './content-packs/life-uk.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.match('./index.html');
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
