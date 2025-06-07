
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './use-toast';
import { useRealtimeChat } from './useRealtimeChat';

export interface EnhancedMessage {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read: boolean;
  message_status: 'sending' | 'sent' | 'delivered' | 'read';
  edited_at?: string;
  reactions: any[];
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'location';
  attachment_url?: string;
  file_name?: string;
  file_size?: number;
  duration?: number;
  sender_username?: string;
  sender_avatar_url?: string;
}

export interface ConversationSettings {
  id: string;
  user_id: string;
  other_user_id: string;
  notifications_enabled: boolean;
  archived: boolean;
  pinned: boolean;
  muted: boolean;
  background_image?: string;
  nickname?: string;
}

export const useEnhancedMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  // Realtime setup
  const { isConnected } = useRealtimeChat({
    recipientId: activeConversation,
    onNewMessage: (message) => {
      console.log('🔔 New message received:', message);
      
      // Show notification if not in active conversation or app not focused
      if (message.sender_id !== user?.id && 
          (!activeConversation || message.sender_id !== activeConversation || document.hidden)) {
        showNotification(message);
      }
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['chat-users'] });
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['conversation', activeConversation] });
      }
    },
    onMessageUpdate: (message) => {
      console.log('📝 Message updated:', message);
      queryClient.invalidateQueries({ queryKey: ['conversation', message.sender_id === user?.id ? message.recipient_id : message.sender_id] });
    }
  });

  // Get conversation with enhanced features
  const useConversation = useCallback((otherUserId: string, searchTerm?: string) => {
    return useQuery({
      queryKey: ['conversation', otherUserId, searchTerm],
      queryFn: async (): Promise<EnhancedMessage[]> => {
        if (!user || !otherUserId) return [];

        const { data, error } = await supabase.rpc('get_conversation_messages', {
          p_user_id: user.id,
          p_other_user_id: otherUserId,
          p_limit: 100,
          p_offset: 0,
          p_search_term: searchTerm || null
        });

        if (error) {
          console.error('Error fetching conversation:', error);
          throw error;
        }

        return data || [];
      },
      enabled: !!user && !!otherUserId,
      staleTime: 5000,
    });
  }, [user]);

  // Send message with enhanced features
  const useSendMessage = () => useMutation({
    mutationFn: async ({ 
      recipientId, 
      content, 
      messageType = 'text',
      attachmentUrl,
      fileName,
      fileSize,
      duration
    }: { 
      recipientId: string; 
      content: string; 
      messageType?: string;
      attachmentUrl?: string;
      fileName?: string;
      fileSize?: number;
      duration?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          message_type: messageType,
          attachment_url: attachmentUrl,
          file_name: fileName,
          file_size: fileSize,
          duration: duration
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-users'] });
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['conversation', activeConversation] });
      }
    }
  });

  // Add message reaction
  const useToggleReaction = () => useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('toggle_message_reaction', {
        p_message_id: messageId,
        p_user_id: user.id,
        p_reaction_type: reaction
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['conversation', activeConversation] });
      }
    }
  });

  // Get conversation settings
  const useConversationSettings = (otherUserId: string) => useQuery({
    queryKey: ['conversation-settings', otherUserId],
    queryFn: async (): Promise<ConversationSettings | null> => {
      if (!user || !otherUserId) return null;

      const { data, error } = await supabase
        .from('conversation_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('other_user_id', otherUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching conversation settings:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !!otherUserId
  });

  // Update conversation settings
  const useUpdateConversationSettings = () => useMutation({
    mutationFn: async ({ 
      otherUserId, 
      settings 
    }: { 
      otherUserId: string; 
      settings: Partial<ConversationSettings> 
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('conversation_settings')
        .upsert({
          user_id: user.id,
          other_user_id: otherUserId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { otherUserId }) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-settings', otherUserId] });
    }
  });

  // Mark conversation as read with enhanced function
  const useMarkConversationAsRead = () => useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('mark_conversation_as_read_optimized', {
        p_recipient_id: user.id,
        p_sender_id: otherUserId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-users'] });
    }
  });

  // Show notification function
  const showNotification = useCallback(async (message: any) => {
    if (!('Notification' in window)) return;

    // Request permission if not granted
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification('Nova mensagem', {
        body: message.content,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    }
  }, []);

  // Clear conversation function
  const useClearConversation = () => useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('clear_conversation', {
        p_user_id: user.id,
        p_other_user_id: otherUserId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-users'] });
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['conversation', activeConversation] });
      }
    }
  });

  return {
    // State
    activeConversation,
    setActiveConversation,
    isConnected,

    // Hooks
    useConversation,
    useSendMessage,
    useToggleReaction,
    useConversationSettings,
    useUpdateConversationSettings,
    useMarkConversationAsRead,
    useClearConversation,

    // Functions
    showNotification
  };
};
