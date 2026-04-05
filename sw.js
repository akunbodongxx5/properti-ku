// Bump this + query ?v= in index.html when shipping JS/CSS changes (avoids stale PWA/browser cache).
const CACHE_NAME = 'propertiKu-v6';
const ASSETS = [
  './',
  './index.html',
  './app.js?v=6',
  './styles.css?v=6',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

// Install — cache app shell (each asset optional so one 404 does not abort the whole install)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch(() => {
            /* optional asset or offline during first visit */
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first, fallback to cache (ensures updates are picked up)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then((response) => {
        // Update cache with fresh response
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback to cache
        return caches.match(e.request);
      })
    );
  } else {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});
