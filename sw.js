const CACHE_NAME = 'propertiKu-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './icon.svg'
];

// Install — cache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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

// Fetch — cache-first for cached assets, network-first for others
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Cache-first for same-origin cached assets
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        // Network-first for non-cached resources
        return fetch(e.request).then((response) => {
          return response;
        }).catch(() => cached);
      })
    );
  } else {
    // Network-first for external resources
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});
