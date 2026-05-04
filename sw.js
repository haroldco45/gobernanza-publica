// GOBERNANZA PRO HM — Service Worker v1.0
// Desarrollado por Vibras Positivas HM

const CACHE_NAME = 'gobernanza-pro-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ── INSTALL: precache recursos estáticos ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Precacheando assets...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: limpiar cachés antiguas ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: Cache-First para estáticos, Network-First para externas ─────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Recursos externos (SECOP, PACO, etc.) → solo red, sin cachear
  if (url.origin !== self.location.origin) {
    return; // pasa directo al navegador
  }

  // Recursos propios → Cache-First con fallback a red
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cachear respuesta válida
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: si piden el HTML y no hay red
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── SYNC en background (por si se expande funcionalidad) ──────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-veeduria') {
    console.log('[SW] Sincronización background iniciada');
  }
});

