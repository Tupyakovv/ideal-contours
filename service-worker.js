const CACHE = 'ideal-contours-v8'; // <-- увеличь версию, чтобы iOS точно обновил SW
const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  // подчистим старые кэши
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Навигационные запросы -> всегда отдаём index.html (SPA-фоллбэк)
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Если это переход/открытие страницы
  if (req.mode === 'navigate') {
    e.respondWith(
      (async () => {
        try {
          // Сначала сеть (чтобы получать свежую версию)
          const net = await fetch(req);
          return net;
        } catch (err) {
          // Если офлайн — из кэша
          const cache = await caches.open(CACHE);
          return (await cache.match('/index.html')) || Response.error();
        }
      })()
    );
    return;
  }

  // Остальные запросы: сначала кэш, потом сеть
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
