
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeManager } from '@/services/RealtimeManager';

export const usePresenceRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void) | null>(null);
  const subscriberIdRef = useRef(`presence-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!user?.id) {
      console.log('❌ usePresenceRealtime: No user ID');
      return;
    }

    console.log('👤 usePresenceRealtime: Setting up subscription');

    const cleanup = realtimeManager.subscribe(
      {
        channelName: 'presence-realtime',
        filters: [
          {
            event: '*',
            schema: 'public',
            table: 'user_presence'
          },
          {
            event: '*',
            schema: 'public',
            table: 'typing_status'
          }
        ],
        onSubscriptionChange: () => {
          console.log('👤 Presence/Typing change detected');
          // Invalidate presence-related queries
          queryClient.invalidateQueries({ queryKey: ['user-presence'] });
          queryClient.invalidateQueries({ queryKey: ['typing-status'] });
        }
      },
      subscriberIdRef.current
    );

    cleanupRef.current = cleanup;

    return () => {
      console.log('🧹 usePresenceRealtime: Cleaning up');
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [user?.id, queryClient]);

  return {
    isSubscribed: cleanupRef.current !== null
  };
};
