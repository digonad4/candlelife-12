
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
  const isSetupRef = useRef(false);

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      console.log('🧹 Cleaning up realtime channel');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Warning cleaning up channel:', error);
      }
      channelRef.current = null;
      isSetupRef.current = false;
      setIsConnected(false);
    }
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user?.id || isSetupRef.current) return;

    cleanupChannel();
    
    const channelName = `chat_${user.id}_${recipientId || 'global'}`;
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
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['chat-users'] });
          if (recipientId) {
            queryClient.invalidateQueries({ queryKey: ['conversation', recipientId] });
          }
        } else if (payload.eventType === 'UPDATE') {
          console.log('📝 Message updated:', payload.new);
          onMessageUpdate?.(payload.new);
          
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

    // Subscribe to channel
    channel.subscribe(async (status) => {
      console.log('📡 Realtime channel status:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime connected successfully');
        setIsConnected(true);
        isSetupRef.current = true;
        
        // Update user presence
        try {
          await supabase.rpc('update_user_presence', {
            p_user_id: user.id,
            p_status: 'online',
            p_conversation_id: recipientId || undefined
          });
        } catch (error) {
          console.error('❌ Error updating presence:', error);
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.log('❌ Realtime connection error or closed:', status);
        setIsConnected(false);
        isSetupRef.current = false;
      }
    });

    channelRef.current = channel;
  }, [user?.id, recipientId, onNewMessage, onMessageUpdate, onTypingUpdate, queryClient, cleanupChannel]);

  useEffect(() => {
    if (user?.id && !isSetupRef.current) {
      setupRealtimeSubscription();
    }

    return cleanupChannel;
  }, [user?.id, recipientId, setupRealtimeSubscription, cleanupChannel]);

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
