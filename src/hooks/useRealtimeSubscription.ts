
import { useEffect, useRef } from 'react';
import { realtimeManager } from '@/services/RealtimeManager';

interface SubscriptionConfig {
  channelName: string;
  onSubscriptionChange?: (payload: any) => void;
  filters?: Array<{
    event: string;
    schema?: string;
    table?: string;
    filter?: string;
  }>;
  dependencies?: any[];
}

export const useRealtimeSubscription = ({
  channelName,
  onSubscriptionChange,
  filters = [],
  dependencies = []
}: SubscriptionConfig) => {
  const cleanupRef = useRef<(() => void) | null>(null);
  const subscriberIdRef = useRef(`${channelName}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    console.log(`📡 useRealtimeSubscription: Setting up ${channelName}`);

    const cleanup = realtimeManager.subscribe(
      {
        channelName,
        filters,
        onSubscriptionChange
      },
      subscriberIdRef.current
    );

    cleanupRef.current = cleanup;

    return () => {
      console.log(`🧹 useRealtimeSubscription: Cleaning up ${channelName}`);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [channelName, onSubscriptionChange, JSON.stringify(filters), ...dependencies]);

  return {
    isSubscribed: cleanupRef.current !== null,
    cleanup: () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    }
  };
};
