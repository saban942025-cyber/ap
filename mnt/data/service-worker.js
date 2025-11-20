self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
      const data = event.data.json();
      const title = data.title || 'הודעה חדשה';
      const options = {
        body: data.body || 'יש לך הודעה חדשה מ-Saban Logistics',
        icon: 'https://ui-avatars.com/api/?name=S&background=008069&color=fff',
        badge: 'https://ui-avatars.com/api/?name=S&background=008069&color=fff',
        data: { url: data.url || '/' },
        vibrate: [100, 50, 100]
      };

      event.waitUntil(self.registration.showNotification(title, options));
      
      // Notify clients to update UI/Sound
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'PUSH_RECEIVED' }));
      });
      
  } catch(e) { console.error('Push processing error', e); }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
        return clientList[0].navigate(event.notification.data.url);
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});

self.addEventListener('message', (event) => {
  // Handle messages from client
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
