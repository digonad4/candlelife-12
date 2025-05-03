
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';

class NotificationService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    if (Capacitor.isNativePlatform()) {
      try {
        // Initialize local notifications for Android and iOS
        await LocalNotifications.requestPermissions();
        
        // Initialize push notifications
        await PushNotifications.requestPermissions();
        await PushNotifications.register();
        
        // Set up push notification listeners
        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
        });
        
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });
        
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received: ' + JSON.stringify(notification));
        });
        
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed', notification.actionId, notification.inputValue);
        });
        
        this.initialized = true;
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    } else {
      // Web notification permission
      if (typeof Notification !== 'undefined' && Notification.permission !== "granted") {
        await Notification.requestPermission();
      }
      this.initialized = true;
    }
  }
  
  async showMessageNotification(title: string, body: string, data?: any) {
    try {
      await this.initialize();
      
      if (Capacitor.isNativePlatform()) {
        // Use local notifications on mobile device
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Date.now(),
              extra: data,
              sound: 'default',
              smallIcon: 'ic_launcher_foreground', // Android icon name
            }
          ]
        });
      } else if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
        // Use Web Notifications in browser
        const notification = new Notification(title, {
          body: body,
          icon: '/favicon.ico',
          tag: 'message-notification',
          requireInteraction: true
        });
        
        notification.onclick = () => {
          window.focus();
          if (data?.senderId) {
            window.dispatchEvent(new CustomEvent('open-chat', { 
              detail: { 
                userId: data.senderId, 
                userName: data.senderName,
                userAvatar: data.senderAvatar
              } 
            }));
          }
        };
      }
    } catch (error) {
      console.error("Erro ao exibir notificação:", error);
    }
  }
  
  async showMultipleMessagesNotification(count: number, senderName?: string) {
    const title = count > 1 ? "Novas Mensagens" : "Nova Mensagem";
    const body = senderName 
      ? `Você tem ${count} nova${count > 1 ? 's' : ''} mensagem${count > 1 ? 'ns' : ''} de ${senderName}` 
      : `Você tem ${count} nova${count > 1 ? 's' : ''} mensagem${count > 1 ? 'ns' : ''}`;
    
    await this.showMessageNotification(title, body);
  }
}

export const notificationService = new NotificationService();
