
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

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
        presence: { key: user.id },
        broadcast: { self: false },
        postgres_changes: [
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: recipientId 
              ? `or(and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id}))` 
              : `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
          }
        ]
      }
    });

    // Subscribe to messages
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        console.log('💬 Realtime message event:', payload);
        
        if (payload.eventType === 'INSERT') {
          console.log('📩 New message received:', payload.new);
          onNewMessage?.(payload.new);
          
          // Invalidate queries with throttling
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['chat-users'] });
            if (recipientId) {
              queryClient.invalidateQueries({ queryKey: ['conversation', recipientId] });
            }
          }, 500);
        } else if (payload.eventType === 'UPDATE') {
          console.log('📝 Message updated:', payload.new);
          onMessageUpdate?.(payload.new);
          
          if (recipientId) {
            queryClient.invalidateQueries({ queryKey: ['conversation', recipientId] });
          }
        }
      }
    );

    // Subscribe to channel
    channel.subscribe(async (status) => {
      console.log('📡 Realtime channel status:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime connected successfully');
        setIsConnected(true);
        isSetupRef.current = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.log('❌ Realtime connection error or closed:', status);
        setIsConnected(false);
        isSetupRef.current = false;
        
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (!isSetupRef.current) {
            console.log('🔄 Attempting to reconnect...');
            setupRealtimeSubscription();
          }
        }, 5000);
      }
    });

    channelRef.current = channel;
  }, [user?.id, recipientId, onNewMessage, onMessageUpdate, queryClient, cleanupChannel]);

  useEffect(() => {
    if (user?.id && !isSetupRef.current) {
      // Add a small delay to prevent rapid reconnections
      const timer = setTimeout(() => {
        setupRealtimeSubscription();
      }, 1000);
      
      return () => clearTimeout(timer);
    }

    return cleanupChannel;
  }, [user?.id, recipientId, setupRealtimeSubscription, cleanupChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupChannel();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [cleanupChannel]);

  return {
    isConnected,
    channel: channelRef.current
  };
};
