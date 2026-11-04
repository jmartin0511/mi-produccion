/* Service worker de Mi Producción.
   Guarda la app para que abra sin conexión. Los datos del usuario NO están aquí:
   viven en IndexedDB del navegador, así que actualizar la app nunca los toca. */
const CACHE = 'mi-produccion-v1.1';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'fonts/manrope-latin-wght-normal.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Responde al instante desde la copia guardada y la renueva en segundo plano.
   La versión nueva se ve la siguiente vez que se abre la app. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = (await cache.match(req, { ignoreSearch: true })) ||
                (req.mode === 'navigate' ? await cache.match('index.html') : undefined);
    const net = fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    e.waitUntil(net);
    return hit || (await net) || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
