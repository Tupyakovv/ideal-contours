const CACHE = 'ideal-contours-v21'; // ↑ новая версия
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// навигационные запросы (HTML) — всегда network-first, чтобы не залип старый index.html
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const isNavigate = req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));
  if (isNavigate) {
    e.respondWith(
      fetch(req).then(res => {
        // фоново положим копию в кэш
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./', copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match('./')) // офлайн — показываем кешированный index
    );
    return;
  }
  // остальное — cache-first
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))))
  ;
  self.clients.claim();

});