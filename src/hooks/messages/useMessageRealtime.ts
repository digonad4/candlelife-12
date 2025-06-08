
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export const useMessageRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for messages');

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
        },
        (payload) => {
          console.log('Message realtime update:', payload);
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({
            queryKey: ['chat-users']
          });
          
          queryClient.invalidateQueries({
            queryKey: ['conversation']
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up message realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};
