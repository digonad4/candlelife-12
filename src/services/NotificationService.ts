
import { pushNotificationService } from './PushNotificationService';

class NotificationService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      await pushNotificationService.initialize();
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }
  
  async showMessageNotification(title: string, body: string, data?: any) {
    try {
      await this.initialize();
      await pushNotificationService.showLocalNotification(title, body, data);
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

  async updateBadgeCount(count: number) {
    await pushNotificationService.updateBadgeCount(count);
  }
}

export const notificationService = new NotificationService();
