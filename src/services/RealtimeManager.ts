
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionConfig {
  channelName: string;
  filters: Array<{
    event: string;
    schema?: string;
    table?: string;
    filter?: string;
  }>;
  onSubscriptionChange?: (payload: any) => void;
}

interface ActiveSubscription {
  channel: any;
  config: SubscriptionConfig;
  isSubscribed: boolean;
  subscribers: Set<string>;
}

class RealtimeManager {
  private static instance: RealtimeManager;
  private activeSubscriptions = new Map<string, ActiveSubscription>();
  private subscriptionQueue = new Map<string, NodeJS.Timeout>();

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  private generateChannelKey(config: SubscriptionConfig): string {
    const filtersKey = config.filters
      .map(f => `${f.event}-${f.table}`)
      .sort()
      .join('|');
    return `${config.channelName}-${filtersKey}`;
  }

  subscribe(config: SubscriptionConfig, subscriberId: string): () => void {
    const channelKey = this.generateChannelKey(config);
    
    console.log(`📡 RealtimeManager: Subscribe request for ${channelKey} by ${subscriberId}`);

    // Clear any pending subscription for this channel
    if (this.subscriptionQueue.has(channelKey)) {
      clearTimeout(this.subscriptionQueue.get(channelKey)!);
      this.subscriptionQueue.delete(channelKey);
    }

    // Debounce subscription creation
    const timeoutId = setTimeout(() => {
      this.createOrUpdateSubscription(config, subscriberId, channelKey);
      this.subscriptionQueue.delete(channelKey);
    }, 100);

    this.subscriptionQueue.set(channelKey, timeoutId);

    // Return cleanup function
    return () => this.unsubscribe(channelKey, subscriberId);
  }

  private createOrUpdateSubscription(config: SubscriptionConfig, subscriberId: string, channelKey: string) {
    let subscription = this.activeSubscriptions.get(channelKey);

    if (!subscription) {
      // Create new subscription
      const uniqueChannelName = `${config.channelName}-${Date.now()}`;
      console.log(`🔧 RealtimeManager: Creating new channel ${uniqueChannelName}`);
      
      let channel = supabase.channel(uniqueChannelName);

      // Add filters
      config.filters.forEach(filter => {
        if (filter.event === '*') {
          ['INSERT', 'UPDATE', 'DELETE'].forEach(eventType => {
            channel = channel.on(
              'postgres_changes',
              {
                event: eventType as any,
                schema: filter.schema || 'public',
                table: filter.table,
                filter: filter.filter
              },
              (payload) => this.handlePayload(channelKey, payload)
            );
          });
        } else {
          channel = channel.on(
            'postgres_changes',
            {
              event: filter.event as any,
              schema: filter.schema || 'public',
              table: filter.table,
              filter: filter.filter
            },
            (payload) => this.handlePayload(channelKey, payload)
          );
        }
      });

      subscription = {
        channel,
        config,
        isSubscribed: false,
        subscribers: new Set()
      };

      this.activeSubscriptions.set(channelKey, subscription);

      // Subscribe to channel
      channel.subscribe((status) => {
        console.log(`📊 RealtimeManager: Channel ${uniqueChannelName} status: ${status}`);
        
        if (subscription) {
          if (status === 'SUBSCRIBED') {
            subscription.isSubscribed = true;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            subscription.isSubscribed = false;
            if (subscription.subscribers.size === 0) {
              this.activeSubscriptions.delete(channelKey);
            }
          }
        }
      });
    }

    // Add subscriber
    subscription.subscribers.add(subscriberId);
    console.log(`👥 RealtimeManager: Added subscriber ${subscriberId} to ${channelKey} (total: ${subscription.subscribers.size})`);
  }

  private handlePayload(channelKey: string, payload: any) {
    const subscription = this.activeSubscriptions.get(channelKey);
    if (subscription && subscription.config.onSubscriptionChange) {
      subscription.config.onSubscriptionChange(payload);
    }
  }

  unsubscribe(channelKey: string, subscriberId: string) {
    console.log(`🚪 RealtimeManager: Unsubscribe request for ${channelKey} by ${subscriberId}`);
    
    const subscription = this.activeSubscriptions.get(channelKey);
    if (!subscription) return;

    subscription.subscribers.delete(subscriberId);
    console.log(`👥 RealtimeManager: Removed subscriber ${subscriberId} from ${channelKey} (remaining: ${subscription.subscribers.size})`);

    // If no more subscribers, cleanup the channel
    if (subscription.subscribers.size === 0) {
      console.log(`🧹 RealtimeManager: Cleaning up channel ${channelKey}`);
      
      try {
        supabase.removeChannel(subscription.channel);
      } catch (error) {
        console.warn(`⚠️ RealtimeManager: Error removing channel ${channelKey}:`, error);
      }
      
      this.activeSubscriptions.delete(channelKey);
    }
  }

  // Get subscription status
  getSubscriptionStatus(channelKey: string): boolean {
    const subscription = this.activeSubscriptions.get(channelKey);
    return subscription?.isSubscribed || false;
  }

  // Cleanup all subscriptions
  cleanup() {
    console.log(`🧹 RealtimeManager: Cleaning up all subscriptions`);
    
    this.subscriptionQueue.forEach(timeout => clearTimeout(timeout));
    this.subscriptionQueue.clear();

    this.activeSubscriptions.forEach((subscription, channelKey) => {
      try {
        supabase.removeChannel(subscription.channel);
      } catch (error) {
        console.warn(`⚠️ RealtimeManager: Error removing channel ${channelKey}:`, error);
      }
    });
    
    this.activeSubscriptions.clear();
  }
}

export const realtimeManager = RealtimeManager.getInstance();
