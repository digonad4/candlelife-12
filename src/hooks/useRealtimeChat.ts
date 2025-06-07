
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

    const channel = supabase.channel(`chat_${user.id}_${Date.now()}`, {
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
        filter: recipientId ? `or(and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id}))` : `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
      },
      (payload) => {
        console.log('💬 Realtime message:', payload);
        
        if (payload.eventType === 'INSERT' && onNewMessage) {
          onNewMessage(payload.new);
        } else if (payload.eventType === 'UPDATE' && onMessageUpdate) {
          onMessageUpdate(payload.new);
        }

        // Invalidate chat queries
        queryClient.invalidateQueries({ queryKey: ['chat-users'] });
        queryClient.invalidateQueries({ queryKey: ['conversation'] });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }
    );

    // Subscribe to typing status
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_status',
        filter: `conversation_with_user_id.eq.${user.id}`
      },
      (payload) => {
        console.log('⌨️ Typing status:', payload);
        if (onTypingUpdate) {
          onTypingUpdate(payload.new);
        }
      }
    );

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
        if (onPresenceUpdate) {
          onPresenceUpdate(payload.new);
        }
      }
    );

    // Track presence
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
      console.log('📡 Realtime status:', status);
      setIsConnected(status === 'SUBSCRIBED');
      
      if (status === 'SUBSCRIBED') {
        // Update user presence
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
      }
    });

    channelRef.current = channel;
  }, [user?.id, recipientId, onNewMessage, onMessageUpdate, onTypingUpdate, onPresenceUpdate, queryClient]);

  useEffect(() => {
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setupRealtimeSubscription]);

  // Update presence when going offline
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user?.id) {
        await supabase.rpc('update_user_presence', {
          p_user_id: user.id,
          p_status: 'offline'
        });
      }
    };

    const handleVisibilityChange = async () => {
      if (user?.id) {
        const status = document.hidden ? 'away' : 'online';
        await supabase.rpc('update_user_presence', {
          p_user_id: user.id,
          p_status: status,
          p_conversation_id: recipientId || undefined
        });
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
