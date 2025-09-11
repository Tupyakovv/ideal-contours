const CACHE = 'ideal-contours-v37'; // ↑ новая версия
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];


// --- PUSH: показать уведомление из payload ---
self.addEventListener('push', (event)=>{
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e){}
  const title = (data.notification && data.notification.title) || data.title || 'Напоминание';
  const options = {
    body:  (data.notification && data.notification.body)  || data.body  || '',
    icon:  '/icons/icon-192.png',

    data:  data.data || {}
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// --- клик по уведомлению: открываем/фокусируем приложение ---
self.addEventListener('notificationclick', (event)=>{
  event.notification.close();
  event.waitUntil(
    (async ()=>{
      const all = await clients.matchAll({ type:'window', includeUncontrolled:true });
      if (all.length) return all[0].focus();
      return clients.openWindow(self.registration.scope);
    })()
  );
});


// навигационные запросы (HTML) — всегда network-first, чтобы не залип старый index.html
self.addEventListener('fetch', event => {
  const u = new URL(event.request.url);
  if (u.hostname.endsWith('cloud-api.yandex.net')) return; // никогда не кэшировать API

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate',  e => e.waitUntil(self.clients.claim()));