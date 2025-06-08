
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

class PushNotificationService {
  private initialized = false;
  private fcmToken: string | null = null;
  private permissionStatus: PermissionStatus | null = null;

  async initialize() {
    if (this.initialized) return;
    
    try {
      if (Capacitor.isNativePlatform()) {
        await this.initializeNative();
      } else {
        await this.initializeWeb();
      }
      this.initialized = true;
      console.log('🔔 Push notification service initialized');
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  }

  private async initializeNative() {
    try {
      // Request permissions for local notifications
      const localResult = await LocalNotifications.requestPermissions();
      this.permissionStatus = localResult;
      console.log('📱 Local notifications permission:', localResult.display);
      
      // Request permissions for push notifications
      const pushResult = await PushNotifications.requestPermissions();
      console.log('📱 Push notifications permission:', pushResult.receive);
      
      if (pushResult.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
        console.log('📱 Registered for push notifications');
      }
      
      // Set up listeners
      PushNotifications.addListener('registration', async (token) => {
        console.log('🎯 Push registration success, token:', token.value);
        this.fcmToken = token.value;
        await this.saveFCMToken(token.value);
      });
      
      PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ Push registration error:', JSON.stringify(error));
      });
      
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('📩 Push notification received:', JSON.stringify(notification));
        this.handleNotificationReceived(notification);
      });
      
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('👆 Push notification action performed:', notification.actionId, notification.inputValue);
        this.handleNotificationTapped(notification);
      });

    } catch (error) {
      console.error('❌ Error initializing native push notifications:', error);
    }
  }

  private async initializeWeb() {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('🔧 Service Worker registered:', registration);
      }
      
      if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        console.log('🌐 Web notification permission:', permission);
      }
    } catch (error) {
      console.error('❌ Error initializing web notifications:', error);
    }
  }

  private async saveFCMToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save FCM token to push_tokens table
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          platform: Capacitor.getPlatform(),
          device_info: {
            platform: Capacitor.getPlatform(),
            isNative: Capacitor.isNativePlatform()
          },
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error saving FCM token:', error);
      } else {
        console.log('✅ FCM token saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
  }

  async showLocalNotification(title: string, body: string, data?: any) {
    try {
      if (Capacitor.isNativePlatform()) {
        const hasPermission = await this.checkPermissions();
        if (!hasPermission) {
          console.warn('⚠️ No permission for local notifications');
          return;
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now(),
              extra: data,
              sound: 'default',
              smallIcon: 'ic_launcher_foreground',
              iconColor: '#8B5CF6',
              actionTypeId: 'OPEN_CHAT',
              actions: [
                {
                  id: 'open',
                  title: 'Abrir'
                },
                {
                  id: 'dismiss',
                  title: 'Dispensar'
                }
              ]
            }
          ]
        });
        console.log('📱 Local notification scheduled');
      } else if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'message-notification',
          requireInteraction: true,
          data
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
          notification.close();
        };

        setTimeout(() => notification.close(), 5000);
        console.log('🌐 Web notification shown');
      }
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  private async checkPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return false;
    }
  }

  private handleNotificationReceived(notification: any) {
    // Handle notification received while app is in foreground
    const { title, body, data } = notification;
    
    // Show custom in-app notification or update UI
    window.dispatchEvent(new CustomEvent('notification-received', {
      detail: { title, body, data }
    }));

    // Show a local notification if app is in foreground
    if (data?.type === 'message') {
      this.showLocalNotification(title, body, data);
    }
  }

  private handleNotificationTapped(notification: any) {
    // Handle notification tap
    const { data } = notification.notification;
    
    if (data?.senderId) {
      window.dispatchEvent(new CustomEvent('open-chat', {
        detail: {
          userId: data.senderId,
          userName: data.senderName,
          userAvatar: data.senderAvatar
        }
      }));
    }

    // Navigate to appropriate page based on notification type
    if (data?.route) {
      window.location.hash = data.route;
    }
  }

  async updateBadgeCount(count: number) {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [{
            id: 999999,
            title: '',
            body: '',
            extra: { badge: count },
            schedule: { at: new Date(Date.now() + 1000) }
          }]
        });
        console.log('🔢 Badge count updated:', count);
      }
    } catch (error) {
      console.error('❌ Error updating badge count:', error);
    }
  }

  getFCMToken(): string | null {
    return this.fcmToken;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const pushNotificationService = new PushNotificationService();
