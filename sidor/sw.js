// /sidor/sw.js v2.0 (Based on driver-app v50 strategy)

const CACHE_NAME = 'deliverymaster-admin-v2'; // Updated name/version
const urlsToCache = [
  './', // Root relative to sw.js (i.e., /sidor/)
  './index.html',
  './customer.html', // Add customer page
  './log.html',     // Add log page
  // './manifest.json', // If you add one for the admin app
  '../shared/firebase-init.js', // Cache the shared module
  // Core external libraries
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/feather-icons',
  // Potentially add fonts if critical and self-hosted or stable URLs
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap', // Google font URL might change
  // Add App Icon if you have one specific for admin
  'https://i.postimg.cc/ryPT3r29/image.png' // Assuming same icon for now
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  console.log('[SW Admin v2] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW Admin v2] Caching core assets:', urlsToCache);
        // Use individual add requests and ignore errors for non-critical assets like fonts
        const cachePromises = urlsToCache.map(urlToCache => {
             return cache.add(urlToCache).catch(err => {
                 console.warn(`[SW Admin v2] Failed to cache ${urlToCache}: ${err}`);
             });
         });
         return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting()) // Activate new SW immediately
      .catch(err => {
           console.error('[SW Admin v2] Cache open/addAll failed during install:', err);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW Admin v2] Activate event');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SW Admin v2] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Take control of open clients
    .catch(err => {
        console.error('[SW Admin v2] Activation failed:', err);
    })
  );
});


// Fetch event: Cache first, then network, excluding Firebase/Map APIs
self.addEventListener('fetch', event => {
    // Ignore non-GET requests
    if (event.request.method !== 'GET') {
        // console.log('[SW Admin v2] Ignoring non-GET request:', event.request.method, event.request.url);
        return; // Allow request to proceed normally
    }

    const url = new URL(event.request.url);

    // Ignore Firebase, Map Tiles, Nominatim Geocoding
    if (url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebaseapp.com') || // Covers Auth domain
        url.hostname.includes('identitytoolkit.googleapis.com') || // Explicit Auth API
        url.hostname.includes('tile.openstreetmap.org') || // Map tiles
        url.hostname.includes('nominatim.openstreetmap.org') || // Geocoding
        url.hostname.includes('googleusercontent.com') // Potential Google Maps links? Be cautious
       ) {
       // console.log('[SW Admin v2] Ignoring API/Map request:', url.href);
        return; // Let it go to the network
    }

    // Cache first strategy for all other GET requests
    event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              // console.log('[SW Admin v2] Serving from cache:', event.request.url);
              return cachedResponse;
            }

            // console.log('[SW Admin v2] Fetching from network:', event.request.url);
            return fetch(event.request).then(
              networkResponse => {
                // Optional: Cache successful responses dynamically? Risky for admin app.
                // It's generally safer to rely on the pre-cached assets for admin.
                return networkResponse;
              }
            ).catch(error => {
                 console.error('[SW Admin v2] Fetch failed:', error, event.request.url);
                 // Optional: Return a basic offline page if defined
                 // return caches.match('/offline.html');
                 // Or just let the browser show its offline error
            });
          })
      );
});
