/*
 * Service worker mínimo de PHSPORT (Fase A del porteo PWA).
 *
 * Objetivos:
 *   1. Habilitar la instalabilidad (junto al manifest + iconos).
 *   2. Servir una pantalla /offline con marca cuando no hay red.
 *   3. Cachear estáticos inmutables para arranque rápido.
 *
 * Estrategia deliberadamente conservadora para NO servir HTML rancio:
 *   - Navegación (documentos)      → network-first, fallback a /offline.
 *   - Estáticos hasheados          → cache-first (son inmutables).
 *   - Todo lo demás (APIs/Supabase) → passthrough directo a la red.
 *
 * En la Fase B este mismo fichero ganará los handlers `push` y `notificationclick`.
 */

const CACHE = 'phsport-v2';
const OFFLINE_URL = '/offline';

// Precache mínimo: la propia pantalla offline (para que exista sin red desde ya).
const PRECACHE = [OFFLINE_URL];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE);
      // Activa la nueva versión sin esperar a que se cierren las pestañas viejas.
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Purga versiones de caché anteriores.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// ¿Es un estático inmutable que merece cache-first? (content-hashed / assets propios)
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo GET; el resto (POST/PATCH/…) pasa directo.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Peticiones a otros orígenes (Supabase, APIs externas) → passthrough.
  if (url.origin !== self.location.origin) return;

  // Navegación entre páginas → network-first con fallback offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          const cached = await cache.match(OFFLINE_URL);
          return cached ?? Response.error();
        }
      })()
    );
    return;
  }

  // Estáticos inmutables → cache-first (y se rellena la caché al vuelo).
  if (isImmutableAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return cached ?? Response.error();
        }
      })()
    );
    return;
  }

  // Resto de GET (RSC de datos, etc.) → red directa, sin cachear.
});

// ========================================
// Web Push (Fase B)
// ========================================

// Un push entrante → notificación del SO. El payload lo manda la edge function
// send-push-notification como JSON { title, body, url, tag }.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || 'PHSPORT';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'phsport',
      data: { url: data.url || '/inicio' },
    })
  );
});

// Clic en la notificación → enfoca una ventana abierta de la app (navegándola al
// destino) o abre una nueva.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/inicio';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('focus' in client) {
          if ('navigate' in client) {
            try {
              await client.navigate(url);
            } catch {
              /* algunos navegadores no permiten navigate cross-origin; ignoramos */
            }
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })()
  );
});
