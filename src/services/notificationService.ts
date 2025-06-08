import { supabase } from "@/integrations/supabase/client";

export class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private isPageVisible = true;
  private notificationQueue: any[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    await this.setupServiceWorker();
    this.setupPageVisibility();
    this.setupPermissions();
  }

  private async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private setupPageVisibility() {
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;
      
      if (this.isPageVisible) {
        // Página ficou visível, processar fila de notificações
        this.processNotificationQueue();
      }
    });
  }

  private async setupPermissions() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }

  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window) || !this.registration) {
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      try {
        const subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            // Você precisará adicionar sua chave VAPID aqui
            'YOUR_VAPID_PUBLIC_KEY'
          )
        });

        // Salvar token no banco
        await this.savePushToken(subscription);
        return true;
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        return false;
      }
    }

    return false;
  }

  private async savePushToken(subscription: PushSubscription) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const token = JSON.stringify(subscription);
    const platform = this.detectPlatform();

    await supabase
      .from('push_tokens')
      .upsert({
        user_id: user.id,
        token,
        platform,
        device_info: navigator.userAgent
      });
  }

  private detectPlatform(): 'web' | 'ios' | 'android' {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'ios';
    } else if (userAgent.includes('android')) {
      return 'android';
    }
    return 'web';
  }

  showMessageNotification(title: string, body: string, data?: any) {
    if (this.isPageVisible) {
      // Usuário está ativo, mostrar notificação in-app
      this.showInAppNotification({ content: body }, { username: title.replace('Nova mensagem de ', ''), ...data });
    } else {
      // Usuário está em background, mostrar notificação do sistema
      this.showSystemNotification({ content: body }, { username: title.replace('Nova mensagem de ', ''), ...data });
    }
  }

  showNotification(message: any, sender: any) {
    if (this.isPageVisible) {
      // Usuário está ativo, mostrar notificação in-app
      this.showInAppNotification(message, sender);
    } else {
      // Usuário está em background, mostrar notificação do sistema
      this.showSystemNotification(message, sender);
    }
  }

  private showInAppNotification(message: any, sender: any) {
    // Criar notificação customizada na interface
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 animate-slide-in';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${sender.avatar_url || '/default-avatar.png'}" alt="${sender.username}" class="w-8 h-8 rounded-full">
        <div>
          <p class="font-medium">${sender.username}</p>
          <p class="text-sm opacity-90">${message.content}</p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Remover após 5 segundos
    setTimeout(() => {
      notification.remove();
    }, 5000);

    // Play sound
    this.playNotificationSound();
  }

  private showSystemNotification(message: any, sender: any) {
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(`Nova mensagem de ${sender.username}`, {
      body: message.content,
      icon: sender.avatar_url || '/default-avatar.png',
      badge: '/notification-badge.png',
      tag: `message-${message.id}`,
      data: {
        messageId: message.id,
        senderId: sender.id,
        conversationId: message.sender_id
      }
    });

    notification.onclick = () => {
      window.focus();
      // Navegar para a conversa
      window.location.hash = `#/chat/${sender.id}`;
      notification.close();
    };
  }

  private playNotificationSound() {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Falhou ao reproduzir som
    });
  }

  private processNotificationQueue() {
    // Processar notificações acumuladas enquanto estava em background
    this.notificationQueue.forEach(({ message, sender }) => {
      this.showInAppNotification(message, sender);
    });
    this.notificationQueue = [];
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  updateBadgeCount(count: number) {
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(count > 0 ? count : 0);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
