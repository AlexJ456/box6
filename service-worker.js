const CACHE_NAME = 'box-breathing-cache-v2';
const urlsToCache = [
  'index.html',
  'app.js',
  'manifest.json',
  'icons/icon-72x72.png',
  'icons/icon-96x96.png',
  'icons/icon-128x128.png',
  'icons/icon-144x144.png',
  'icons/icon-152x152.png',
  'icons/icon-192x192.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', event => {
   event.respondWith(
     caches.match(event.request).then(response => response || fetch(event.request))
   );
});
