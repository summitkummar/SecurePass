const CACHE_NAME = 'securepass-v4';
const urlsToCache = [
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first for HTML, cache-fallback for offline
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  
  // For HTML pages - always try network first
  if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }
  
  // For other assets - cache first
  event.respondWith(
    caches.match(req).then(response => response || fetch(req))
  );
});
