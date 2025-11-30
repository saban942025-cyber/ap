const CACHE_NAME = 'saban-os-v25-stable';

// קבצים מקומיים (חובה שיהיו קיימים)
const CORE_ASSETS = [
  './',
  './index.html',
  './client.html',
  './team.html',
  './admin.html',
  './manifest.json',
  './icon.png.png'
];

// קבצים חיצוניים (שומרים בשיטת no-cors כדי למנוע שגיאות)
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// התקנה: שמירה חכמה
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      
      // 1. שמירת קבצים מקומיים
      await cache.addAll(CORE_ASSETS).catch(err => console.warn('Local asset missing:', err));

      // 2. שמירת קבצים חיצוניים בצורה בטוחה (no-cors)
      const externalPromises = EXTERNAL_ASSETS.map(url => {
        const request = new Request(url, { mode: 'no-cors' });
        return fetch(request)
          .then(response => cache.put(request, response))
          .catch(err => console.warn('External asset skipped:', url));
      });
      
      return Promise.all(externalPromises);
    })
  );
});

// הפעלה: ניקוי מטמון ישן
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// שליפה: רשת קודם -> זיכרון -> דף הבית (מונע מסך לבן)
self.addEventListener('fetch', (event) => {
  // מתעלמים מבקשות שאינן GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // אם התשובה תקינה, נעדכן את הזיכרון (רק לקבצי HTTP רגילים)
        if (response && response.status === 200 && response.type === 'basic') {
           const clone = response.clone();
           caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // במקרה של כשל רשת, ניגשים לזיכרון
        return caches.match(event.request).then(cachedRes => {
            if (cachedRes) return cachedRes;
            
            // הצלה: אם המשתמש מנווט ואין רשת/קובץ, נחזיר את דף הבית
            if (event.request.mode === 'navigate') {
               return caches.match('./index.html');
            }

            // הצלה לתמונות: פיקסל שקוף במקום שגיאה
            if (event.request.destination === 'image') {
                return new Response('<svg role="img" aria-label="Error" xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
            }

            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
