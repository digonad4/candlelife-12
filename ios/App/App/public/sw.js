
// Service Worker para Push Notifications
const CACHE_NAME = 'candlelife-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Push event - receber notificações push
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'Nova mensagem recebida',
    icon: data.icon || '/icon-192x192.png',
    badge: '/notification-badge.png',
    image: data.image,
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Abrir conversa'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ],
    tag: data.tag || 'default',
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CandleLife', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'open') {
    // Abrir a aplicação na conversa específica
    const conversationId = event.notification.data.conversationId;
    const url = conversationId ? `/#/social?chat=${conversationId}` : '/#/social';
    
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Verificar se já existe uma janela aberta
        for (let client of clients) {
          if (client.url.includes('/social') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Se não existe janela aberta, abrir nova
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
    );
  }
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Implementar sincronização de mensagens offline
  console.log('Syncing offline messages...');
}

// Handle background fetch (for file uploads)
self.addEventListener('backgroundfetch', (event) => {
  console.log('Background fetch:', event);
});
