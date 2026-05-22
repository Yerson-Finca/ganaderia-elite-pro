// service-worker.js
const CACHE_VERSION = 'v4.6.2';
const CACHE_NAME = `ganadero-elite-${CACHE_VERSION}`;

// 🔹 Recursos críticos (App Shell)
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png'
];

// 🔹 Recursos externos para descarga agresiva en primera carga
const EXTERNAL_URLS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 📥 INSTALACIÓN: Descarga todo lo esencial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] 📦 Precacheando app local...');
      await cache.addAll(PRECACHE_URLS);
      
      console.log('[SW] 🌍 Descargando fuentes e iconos externos...');
      // Descarga uno por uno: si falla un CDN, el resto se guarda igual
      for (const url of EXTERNAL_URLS) {
        try {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res);
        } catch (e) {
          console.warn(`[SW] ⚠️ Fallo al cachear ${url}`);
        }
      }
      console.log('[SW] ✅ App lista para uso OFFLINE total.');
    })
  );
  self.skipWaiting(); // Activa inmediatamente sin esperar cerrar pestañas
});

// 🔄 ACTIVACIÓN: Limpia versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // Toma control de todas las pestañas abiertas
});

// 🌐 FETCH: Estrategia "Cache First + Network Fallback"
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // 1️⃣ Si está en caché → servirlo al instante (0ms de red)
      if (cached) return cached;

      // 2️⃣ Si no está → intentar red
      return fetch(event.request).then((networkRes) => {
        if (!networkRes || networkRes.status !== 200 || networkRes.type !== 'basic') return networkRes;
        // 3️⃣ Guardar en caché para la próxima vez
        const resToCache = networkRes.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, resToCache));
        return networkRes;
      }).catch(() => {
        // 4️⃣ FALLBACK OFFLINE: Si es navegación HTML, servir index.html (SPA)
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
        return new Response('', { status: 404 });
      });
    })
  );
});