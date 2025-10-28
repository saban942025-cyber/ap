// /viewer-app/sw.js v1.0 (Based on driver-app v50 strategy)

const CACHE_NAME = 'deliverymaster-viewer-v1'; // Unique name
const urlsToCache = [
  './', // Root relative to sw.js (i.e., /viewer-app/)
  './index.html',
  './manifest.json',
  '../shared/firebase-init.js', // Cache the shared module
  // Core external libraries
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/feather-icons',
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
  // App Icon
  'https://i.postimg.cc/ryPT3r29/image.png'
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  console.log('[SW Viewer v1] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW Viewer v1] Caching core assets:', urlsToCache);
        const cachePromises = urlsToCache.map(urlToCache => {
             return cache.add(urlToCache).catch(err => console.warn(`[SW Viewer v1] Failed to cache ${urlToCache}: ${err}`));
         });
         return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW Viewer v1] Install failed:', err))
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW Viewer v1] Activate event');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
        cacheNames.map(cacheName => { if (!cacheWhitelist.includes(cacheName)) { console.log('[SW Viewer v1] Deleting old cache:', cacheName); return caches.delete(cacheName); } })
    )).then(() => self.clients.claim()).catch(err => console.error('[SW Viewer v1] Activation failed:', err))
  );
});

// Fetch event: Cache first, then network, excluding Firebase/Map APIs
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebaseapp.com') || url.hostname.includes('identitytoolkit.googleapis.com') || url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('nominatim.openstreetmap.org')) { return; }

    event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => cachedResponse || fetch(event.request).catch(error => console.error('[SW Viewer v1] Fetch failed:', error, event.request.url)))
    );
});
