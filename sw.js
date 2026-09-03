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
  // The app cache-busts static GETs with `?v=<now>` (see index.html). Strip
  // the query so a versioned request hits the bare cached entry offline.
  const bareUrl = new URL(request.url);
  bareUrl.search = '';
  const bareKey = bareUrl.toString();
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return caches.match(bareKey).then(byBare => {
        if (byBare) return byBare;
        return fetch(request).then(response => {
          if (response && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            // Store under the bare key so `file?v=<now>` does not fan out
            // into one cache entry per timestamp; ignoreSearch lookups still
            // match the bare entry for both bare and versioned requests.
            caches.open(CACHE_NAME).then(cache => cache.put(bareKey, copy));
          } else {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        }).catch(() => {
          // Network failed (offline): re-check the bare cache before the
          // app fallback so versioned data GETs still serve offline.
          return caches.match(request, { ignoreSearch: true }).then(
            retry => retry
              || caches.match(bareKey).then(
                retryBare => retryBare
                  || (request.mode === 'navigate'
                    ? caches.match('./index.html')
                    : new Response('Offline', { status: 503, statusText: 'Offline' }))
              )
          );
        });
      });
    })
  );
});
