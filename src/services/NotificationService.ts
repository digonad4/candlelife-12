
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';

class NotificationService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    if (Capacitor.isNativePlatform()) {
      // Inicializa as notificações locais para Android e iOS
      await LocalNotifications.requestPermissions();
      
      // Inicializa as notificações push (para iOS)
      await PushNotifications.requestPermissions();
      await PushNotifications.register();
      
      this.initialized = true;
    } else {
      // Permissão para notificações web
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
        // Usa notificações locais no dispositivo móvel
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Date.now(),
              extra: data,
              sound: 'default',
              smallIcon: 'ic_launcher_foreground', // Nome do ícone no Android
            }
          ]
        });
      } else if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
        // Usa Web Notifications no navegador
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
                userName: data.senderName
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
