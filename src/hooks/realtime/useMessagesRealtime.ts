
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeManager } from '@/services/RealtimeManager';

export const useMessagesRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void) | null>(null);
  const subscriberIdRef = useRef(`messages-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!user?.id) {
      console.log('❌ useMessagesRealtime: No user ID');
      return;
    }

    console.log('📨 useMessagesRealtime: Setting up subscription');

    const cleanup = realtimeManager.subscribe(
      {
        channelName: 'messages-realtime',
        filters: [
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          }
        ],
        onSubscriptionChange: (payload) => {
          console.log("📨 Message change detected:", payload);
          
          // Invalidate chat users query to update unread counts
          queryClient.invalidateQueries({
            queryKey: ["chatUsers"]
          });
          
          // Invalidate specific conversation queries if we have recipient info
          if (payload.new?.recipient_id || payload.new?.sender_id) {
            const conversationUserId = payload.new.recipient_id === user?.id 
              ? payload.new.sender_id 
              : payload.new.recipient_id;
              
            if (conversationUserId) {
              queryClient.invalidateQueries({
                queryKey: ["conversation", conversationUserId]
              });
            }
          }
        }
      },
      subscriberIdRef.current
    );

    cleanupRef.current = cleanup;

    return () => {
      console.log('🧹 useMessagesRealtime: Cleaning up');
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [user?.id, queryClient]);

  return {
    isSubscribed: cleanupRef.current !== null
  };
};
