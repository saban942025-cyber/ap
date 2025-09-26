// Basic service worker for PWA capabilities (caching, offline support)
const CACHE_NAME = 'v6-orders-app-cache-v1';
const urlsToCache = [
  '/',
  '/login.html',
  '/dashboard.html',
  '/materials.html',
  '/containers.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Assistant:wght@400;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
