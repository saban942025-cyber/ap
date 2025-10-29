// שדרוג Service Worker: Stale-While-Revalidate, ניקוי אוטומטי, טיפול ב-API (6)

const CACHE_VERSION = 'v20251029.1_s-w-r'; // גירסת Cache חדשה (6)
const CACHE_NAME = 'deliverymaster-admin-' + CACHE_VERSION;
const CACHE_API_DATA = 'deliverymaster-api-data'; // Cache נפרד לנתוני API
const MOBILE_FALLBACK_DATA = { orders: [], drivers: [], containers: [] }; // JSON Placeholder למצב אופליין (6)

// נכסים קריטיים לטעינה (6)
const urlsToCache = [
  './index2_fixed.html', // שם הקובץ המתוקן (3)
  '/',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/feather-icons',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap' // עדכון לגופן החדש (1)
];

// שלב ההתקנה - מטמון נכסים קריטיים
self.addEventListener('install', event => {
  console.log('[SW] Installing cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // העדפת נכסים קריטיים (6)
        return cache.addAll(urlsToCache.filter(url => !url.includes('firebase') && !url.includes('cdn')));
      })
      // הפעלת skipWaiting כדי להפעיל את ה-SW באופן מיידי (6)
      .then(() => self.skipWaiting())
  );
});

// שלב האקטיבציה - ניקוי Cache ישן (6)
self.addEventListener('activate', event => {
  console.log('[SW] Activating new cache version:', CACHE_NAME);
  const cacheWhitelist = [CACHE_NAME, CACHE_API_DATA];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // מחיקת Cache שאינו ברשימה הלבנה
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    // תפיסת שליטה על כל הלקוחות הפתוחים (6)
    .then(() => self.clients.claim())
  );
});

// שלב ה-Fetch - יישום אסטרטגיית Stale-While-Revalidate וטיפול ב-API (6)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. טיפול בנכסי צד ראשון ובקשות דאטה קריטיות (Stale-While-Revalidate)
  // הנחה: כל קריאה ל-DB/API שהיא לא נכס סטטי היא בקשת דאטה
  const isApiRequest = url.pathname.includes('/api/') || url.hostname.includes('firestore.googleapis.com');
  const isCriticalAsset = urlsToCache.some(u => event.request.url.includes(u.replace('./', '')));


  if (isApiRequest) {
    // אסטרטגיית: Network First with Cache Fallback (לא ניתן להשתמש ב-SWR ישירות ל-DB)
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // שמור את התשובה האחרונה שהתקבלה בהצלחה
          if (response.ok && event.request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_API_DATA).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // Fallback ל-Cache (אם יש)
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;

          // טיפול ספציפי למצב Offline: החזר JSON ריק/Placeholder במקום שבר (6)
          console.warn('[SW] Offline API request. Returning placeholder.');
          // אם הלקוח מקבל JSON, נחזיר תגובת JSON תקינה אך ריקה.
          return new Response(JSON.stringify(MOBILE_FALLBACK_DATA), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
            statusText: 'OK (Offline Placeholder)'
          });
        })
    );
    return;
  }

  // 2. טיפול בנכסים סטטיים (Stale-While-Revalidate) (6)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // שמור את העותק החדש ל-Cache לשימוש עתידי
        if (networkResponse.ok && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(e => {
          // אם הרשת נכשלה לחלוטין ואנחנו בתוך SWR
          console.error('[SW] Network fetch failed for asset:', event.request.url, e);
          throw e; // זרוק שגיאה כדי שהדפדפן ידע
      });

      // החזר את התגובה השמורה מיד (stale) או את הבקשה מהרשת
      return cachedResponse || fetchPromise;
    })
  );
});
