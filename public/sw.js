
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data,
      actions: [
        {
          action: 'reply',
          title: 'Responder'
        },
        {
          action: 'view',
          title: 'Ver'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'reply') {
    // Handle reply action
    event.waitUntil(
      clients.openWindow('/?action=reply&userId=' + event.notification.data.senderId)
    );
  } else {
    // Open app
    event.waitUntil(
      clients.openWindow('/?userId=' + event.notification.data.senderId)
    );
  }
});
