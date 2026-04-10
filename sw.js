// Bump this + query ?v= in index.html when shipping JS/CSS changes (avoids stale PWA/browser cache).
const CACHE_NAME = 'propertiKu-v38';
const ASSETS = [
  './',
  './index.html',
  './privacy.html',
  './analytics.js?v=38',
  './i18n.js?v=38',
  './app.js?v=38',
  './styles.css?v=38',
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

// Fetch — HTML/navigate: selalu revalidate (hindari Beranda tampil versi index lama tanpa kartu Kalender).
// Aset lain: network-first + update cache.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (url.origin !== location.origin) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  const isHtmlShell =
    e.request.mode === 'navigate' ||
    (e.request.method === 'GET' &&
      (url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('index.html')));

  if (isHtmlShell) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    fetch(e.request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
      return response;
    }).catch(() => caches.match(e.request))
  );
});
