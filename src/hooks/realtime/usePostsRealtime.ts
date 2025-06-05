
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeManager } from '@/services/RealtimeManager';

export const usePostsRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void) | null>(null);
  const subscriberIdRef = useRef(`posts-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!user?.id) {
      console.log('❌ usePostsRealtime: No user ID');
      return;
    }

    console.log('📝 usePostsRealtime: Setting up subscription');

    const cleanup = realtimeManager.subscribe(
      {
        channelName: 'posts-realtime',
        filters: [
          {
            event: '*',
            schema: 'public',
            table: 'posts'
          },
          {
            event: '*',
            schema: 'public',
            table: 'comments'
          },
          {
            event: '*',
            schema: 'public',
            table: 'reactions'
          }
        ],
        onSubscriptionChange: () => {
          console.log('📝 Posts/Comments/Reactions change detected');
          // Invalidar a query de posts quando houver mudanças
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      },
      subscriberIdRef.current
    );

    cleanupRef.current = cleanup;

    return () => {
      console.log('🧹 usePostsRealtime: Cleaning up');
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [user?.id, queryClient]);

  return {
    isSubscribed: cleanupRef.current !== null
  };
};
