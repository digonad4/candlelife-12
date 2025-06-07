
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeChatConfig {
  recipientId?: string;
  onNewMessage?: (message: any) => void;
  onMessageUpdate?: (message: any) => void;
  onTypingUpdate?: (typing: any) => void;
  onPresenceUpdate?: (presence: any) => void;
}

export const useRealtimeChat = ({ 
  recipientId, 
  onNewMessage, 
  onMessageUpdate,
  onTypingUpdate,
  onPresenceUpdate 
}: RealtimeChatConfig) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user?.id) return;

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `chat_${user.id}_${recipientId || 'global'}_${Date.now()}`;
    console.log('🔧 Setting up realtime channel:', channelName);

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: user.id }
      }
    });

    // Subscribe to messages
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: recipientId 
          ? `or(and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id}))` 
          : `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
      },
      (payload) => {
        console.log('💬 Realtime message event:', payload);
        
        if (payload.eventType === 'INSERT') {
          console.log('📩 New message received:', payload.new);
          onNewMessage?.(payload.new);
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['chat-users'] });
          queryClient.invalidateQueries({ queryKey: ['conversation'] });
          if (recipientId) {
            queryClient.invalidateQueries({ queryKey: ['conversation', recipientId] });
          }
        } else if (payload.eventType === 'UPDATE') {
          console.log('📝 Message updated:', payload.new);
          onMessageUpdate?.(payload.new);
          
          // Invalidate conversation queries
          queryClient.invalidateQueries({ queryKey: ['conversation'] });
          if (recipientId) {
            queryClient.invalidateQueries({ queryKey: ['conversation', recipientId] });
          }
        }
      }
    );

    // Subscribe to typing status
    if (recipientId) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `conversation_with_user_id.eq.${user.id}`
        },
        (payload) => {
          console.log('⌨️ Typing status update:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            onTypingUpdate?.(payload.new);
          }
        }
      );
    }

    // Subscribe to presence updates
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_presence'
      },
      (payload) => {
        console.log('👤 Presence update:', payload);
        onPresenceUpdate?.(payload.new);
      }
    );

    // Handle presence events
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      console.log('🔄 Presence sync:', presenceState);
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log('✅ User joined:', newPresences);
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('❌ User left:', leftPresences);
    });

    // Subscribe to channel
    channel.subscribe(async (status) => {
      console.log('📡 Realtime channel status:', status);
      setIsConnected(status === 'SUBSCRIBED');
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime connected successfully');
        
        // Update user presence
        try {
          await supabase.rpc('update_user_presence', {
            p_user_id: user.id,
            p_status: 'online',
            p_conversation_id: recipientId || undefined
          });

          // Track presence in channel
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            conversation_id: recipientId || undefined
          });
        } catch (error) {
          console.error('❌ Error updating presence:', error);
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.log('❌ Realtime connection error or closed:', status);
        setIsConnected(false);
      }
    });

    channelRef.current = channel;
  }, [user?.id, recipientId, onNewMessage, onMessageUpdate, onTypingUpdate, onPresenceUpdate, queryClient]);

  useEffect(() => {
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        console.log('🧹 Cleaning up realtime channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupRealtimeSubscription]);

  // Update presence when going offline
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user?.id) {
        try {
          await supabase.rpc('update_user_presence', {
            p_user_id: user.id,
            p_status: 'offline'
          });
        } catch (error) {
          console.error('Error updating presence on unload:', error);
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (user?.id) {
        try {
          const status = document.hidden ? 'away' : 'online';
          await supabase.rpc('update_user_presence', {
            p_user_id: user.id,
            p_status: status,
            p_conversation_id: recipientId || undefined
          });
        } catch (error) {
          console.error('Error updating presence on visibility change:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, recipientId]);

  return {
    isConnected,
    channel: channelRef.current
  };
};
