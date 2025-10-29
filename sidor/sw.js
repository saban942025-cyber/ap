// /sidor/sw.js V33.0 (Standardized)

const CACHE_NAME = 'deliverymaster-admin-v33';
const urlsToCache = [
  './',
  './index.html', // The new canonical index.html (mobile UI)
  './log.html',
  './customer.html',
  './manifest.json',
  '../shared/firebase-init.js',
  '../shared/map-utils.js',
  // Core external libraries
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/feather-icons',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
  // App Icon
  'https://i.postimg.cc/ryPT3r29/image.png'
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  console.log(`[SW ${CACHE_NAME}] Install event`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW ${CACHE_NAME}] Caching core assets...`);
        const cachePromises = urlsToCache.map(urlToCache => {
             return cache.add(urlToCache).catch(err => {
                console.warn(`[SW ${CACHE_NAME}] Failed to cache ${urlToCache}: ${err}`);
             });
         });
         return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error(`[SW ${CACHE_NAME}] Cache open/addAll failed:`, err))
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log(`[SW ${CACHE_NAME}] Activate event`);
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName) && cacheName.startsWith('deliverymaster-admin')) {
            console.log(`[SW ${CACHE_NAME}] Deleting old cache:`, cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event: Cache first, then network, excluding Firebase/Map APIs
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return; 
    }

    const url = new URL(event.request.url);

    // Ignore Firebase, Map Tiles, Nominatim
    if (url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebaseapp.com') ||
        url.hostname.includes('identitytoolkit.googleapis.com') ||
        url.hostname.includes('tile.openstreetmap.org') ||
        url.hostname.includes('nominatim.openstreetmap.org') ||
        url.protocol === 'chrome-extension:'
       ) {
        return; // Let it go to the network
    }

    // Cache first strategy
    event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            const fetchRequest = event.request.clone();
            return fetch(fetchRequest).then(
              networkResponse => {
                if(!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                  return networkResponse;
                }
                
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
                return networkResponse;
              }
            ).catch(error => {
                 console.error(`[SW ${CACHE_NAME}] Fetch failed; network error.`, error, event.request.url);
            });
          })
      );
});
