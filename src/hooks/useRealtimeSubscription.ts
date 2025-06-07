
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  
  // This hook is deprecated in favor of RealtimeManager
  // Return empty cleanup function to prevent conflicts
  const cleanupSubscription = useCallback(() => {
    console.log(`🛑 useRealtimeSubscription is deprecated for: ${channelName}`);
  }, [channelName]);

  // Effect that does nothing but logs deprecation warning
  useEffect(() => {
    console.warn(`⚠️ useRealtimeSubscription is deprecated for ${channelName}. Use RealtimeManager instead.`);
    
    return cleanupSubscription;
  }, [user?.id, cleanupSubscription, ...dependencies]);

  return {
    isSubscribed: false,
    cleanup: cleanupSubscription
  };
};
