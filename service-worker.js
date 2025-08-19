const CACHE = 'ic-cache-v1';
const URLS = [
  './',
  './index.html',
  './manifest.json',
  // добавляй сюда только реально существующие файлы
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      // добавляем по одному и игнорируем ошибки
      for (const url of URLS) {
        try { await cache.add(url); }
        catch (e) { console.warn('[SW] skip', url, e.message); }
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
