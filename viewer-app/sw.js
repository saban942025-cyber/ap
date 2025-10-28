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
        // Add all assets, log errors for individual failures but don't fail install
        const cachePromises = urlsToCache.map(urlToCache => {
             return cache.add(urlToCache).catch(err => {
                 // Ignore errors for external resources like fonts or CDNs that might be flaky
                 if (!urlToCache.startsWith('./') && !urlToCache.startsWith('../')) {
                    console.warn(`[SW Viewer v1] Failed to cache external asset ${urlToCache}: ${err}`);
                 } else {
                    console.error(`[SW Viewer v1] Failed to cache critical asset ${urlToCache}: ${err}`);
                 }
             });
         });
         return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting()) // Activate new SW immediately
      .catch(err => {
           console.error('[SW Viewer v1] Cache open/addAll failed during install:', err);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW Viewer v1] Activate event');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SW Viewer v1] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Take control of open clients
    .catch(err => {
        console.error('[SW Viewer v1] Activation failed:', err);
    })
  );
});


// Fetch event: Cache first, then network, excluding Firebase/Map APIs
self.addEventListener('fetch', event => {
    // Ignore non-GET requests
    if (event.request.method !== 'GET') {
        // console.log('[SW Viewer v1] Ignoring non-GET request:', event.request.method, event.request.url);
        return; // Allow request to proceed normally
    }

    const url = new URL(event.request.url);

    // Ignore Firebase, Map Tiles, Nominatim Geocoding, Chrome extensions
    if (url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebaseapp.com') || // Covers Auth domain
        url.hostname.includes('identitytoolkit.googleapis.com') || // Explicit Auth API
        url.hostname.includes('tile.openstreetmap.org') || // Map tiles
        url.hostname.includes('nominatim.openstreetmap.org') || // Geocoding
        url.protocol === 'chrome-extension:' // Ignore browser extension requests
       ) {
       // console.log('[SW Viewer v1] Ignoring API/Map/Extension request:', url.href);
        return; // Let it go to the network
    }

    // Cache first strategy for all other GET requests
    event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              // console.log('[SW Viewer v1] Serving from cache:', event.request.url);
              return cachedResponse;
            }

            // console.log('[SW Viewer v1] Fetching from network:', event.request.url);
            // Clone the request because it's a stream and can only be consumed once.
            const fetchRequest = event.request.clone();

            return fetch(fetchRequest).then(
              networkResponse => {
                // Check if we received a valid response
                if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                  // Don't cache invalid responses (like opaque responses from CDNs without CORS)
                  return networkResponse;
                }

                // IMPORTANT: Clone the response. A response is a stream
                // and because we want the browser to consume the response
                // as well as the cache consuming the response, we need
                // to clone it so we have two streams.
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME)
                  .then(cache => {
                    // console.log('[SW Viewer v1] Caching new resource:', event.request.url);
                    cache.put(event.request, responseToCache);
                  });

                return networkResponse;
              }
            ).catch(error => {
                 console.error('[SW Viewer v1] Fetch failed; network error.', error, event.request.url);
                 // Optional: Return offline fallback page if network fails
                 // return caches.match('/offline.html');
            });
          })
      );
});
