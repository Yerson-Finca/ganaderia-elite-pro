const CACHE_NAME = 'ganadero-v4.6.2';
// ✅ Solo tus 3 archivos reales
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(res => {
      if (res) return res; // 1️⃣ Sirve desde caché
      return fetch(e.request).then(net => {
        if (net && net.status === 200) {
          const clone = net.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone)); // 2️⃣ Guarda para la próxima
        }
        return net;
      }).catch(() => {
        // 3️⃣ Si no hay internet y es HTML → devuelve index.html
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});