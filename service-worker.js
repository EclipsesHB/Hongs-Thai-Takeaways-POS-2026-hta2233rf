/* ── Hong's Thai POS — Service Worker ──────────────────────────────────────
   Purpose: Enables PWA installability and offline caching of the POS app.
   The app is a single HTML file; we cache it and its CDN dependencies so
   it runs fully offline after first load.
   ────────────────────────────────────────────────────────────────────────── */

const CACHE_NAME = 'hongs-pos-v1';

/* Files to pre-cache on install */
const PRECACHE_URLS = [
  './Hongs_Thai_POS_NEW_P_FINAL.html',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js'
];

/* Install: pre-cache all core assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      /* Take over immediately without waiting for old SW to die */
      return self.skipWaiting();
    })
  );
});

/* Activate: delete old caches */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch: serve from cache first, fall back to network */
self.addEventListener('fetch', function(event) {
  /* Only handle GET requests */
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;

      /* Not in cache — fetch from network and cache the response */
      return fetch(event.request).then(function(response) {
        /* Only cache valid responses */
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(function() {
        /* Network failed and nothing in cache — return a simple offline page */
        return new Response(
          '<h2 style="font-family:sans-serif;padding:2rem;color:#c8a040">Hong\'s POS is offline. Please check your connection.</h2>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    })
  );
});
