const CACHE_NAME = 'ganadero-elite-v3-4';
const OFFLINE_FALLBACK = '/index.html';

// Recursos críticos que se pre-cachearán en la instalación
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

// ==========================================
// 1. INSTALACIÓN: Pre-caché agresivo
// ==========================================
self.addEventListener('install', (event) => {
  console.log('[SW] 🚀 Instalando Service Worker agresivo...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).catch(err => {
        console.warn('[SW] ⚠️ No se pudieron pre-cachear todos los assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ==========================================
// 2. ACTIVACIÓN: Limpieza inmediata de caches viejos
// ==========================================
self.addEventListener('activate', (event) => {
  console.log('[SW] ♻️ Activando y limpiando caches antiguos...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                  .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ==========================================
// 3. FETCH: Estrategia Cache-First + Actualización en segundo plano
// ==========================================
self.addEventListener('fetch', (event) => {
  // Ignorar métodos no GET y esquemas especiales
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension') || 
      event.request.url.startsWith('data:') || 
      event.request.url.startsWith('blob:')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Si existe en cache, servirlo inmediatamente y actualizar en segundo plano
      if (cached) {
        fetch(event.request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const cacheClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheClone));
          }
        }).catch(() => {}); // Silenciar errores de red
        return cached;
      }

      // Si no está en cache, traer de red y guardar
      return fetch(event.request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkRes;
      }).catch(() => {
        // Fallback para navegación HTML
        const isHTML = event.request.headers.get('accept')?.includes('text/html') || event.request.mode === 'navigate';
        if (isHTML) return caches.match(OFFLINE_FALLBACK);
        
        return new Response('⚠️ Sin conexión', { 
          status: 503, 
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});

// ==========================================
// 4. SYNC EN SEGUNDO PLANO (Listo para futuros envíos)
// ==========================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ganadero-data') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('[SW] 🔄 Sync activado. Datos locales ya persistentes.');
        self.clients.matchAll().then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE' }));
        });
      })
    );
  }
});

// ==========================================
// 5. NOTIFICACIONES PUSH (Esqueleto listo)
// ==========================================
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.message || 'Recordatorio de gestión ganadera',
    icon: './assets/icons/icon-192x192.png',
    badge: './assets/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { timestamp: Date.now(), url: './index.html' },
    actions: [
      { action: 'open', title: 'Abrir App', icon: './assets/icons/icon-72x72.png' }
    ]
  };
  event.waitUntil(self.registration.showNotification('Ganadero Élite Pro', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) return windowClients[0].focus();
      return clients.openWindow('./index.html');
    })
  );
});

// ==========================================
// 6. COMUNICACIÓN CON EL FRONTEND (Actualización forzada)
// ==========================================
self.addEventListener('message', (event) => {
  if (event.data?.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.action === 'FORCE_UPDATE') {
    caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))));
    self.skipWaiting();
  }
});
