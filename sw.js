const CACHE_NAME = 'ganadero-elite-v3-6';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Error cacheando:', err))
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(network => {
        if (network && network.status === 200) {
          const clone = network.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return network;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) return caches.match('./index.html');
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
