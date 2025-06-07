
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
    recipientId: activeConversation || undefined,
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

  // Get conversation with enhanced features - using regular messages table for now
  const useConversation = useCallback((otherUserId: string, searchTerm?: string) => {
    return useQuery({
      queryKey: ['conversation', otherUserId, searchTerm],
      queryFn: async (): Promise<EnhancedMessage[]> => {
        if (!user || !otherUserId) return [];

        let query = supabase
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            recipient_id,
            created_at,
            read,
            message_status,
            edited_at,
            attachment_url,
            profiles:sender_id(username, avatar_url)
          `)
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(100);

        if (searchTerm) {
          query = query.ilike('content', `%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching conversation:', error);
          throw error;
        }

        // Transform and reverse to show newest at bottom
        const messages: EnhancedMessage[] = (data || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          recipient_id: msg.recipient_id,
          created_at: msg.created_at,
          read: msg.read,
          message_status: (msg.message_status as 'sending' | 'sent' | 'delivered' | 'read') || 'sent',
          edited_at: msg.edited_at || undefined,
          reactions: [], // Default empty array since column doesn't exist yet
          message_type: 'text', // Default to text since column doesn't exist yet
          attachment_url: msg.attachment_url || undefined,
          file_name: undefined, // Will be available after migration
          file_size: undefined, // Will be available after migration
          duration: undefined, // Will be available after migration
          sender_username: Array.isArray(msg.profiles) && msg.profiles.length > 0 ? msg.profiles[0].username : undefined,
          sender_avatar_url: Array.isArray(msg.profiles) && msg.profiles.length > 0 ? msg.profiles[0].avatar_url : undefined
        })).reverse();

        return messages;
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

      // For now, only insert basic fields that exist in the current schema
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          attachment_url: attachmentUrl
          // message_type, file_name, file_size, duration will be added after schema update
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

  // Add message reaction - simplified for now
  const useToggleReaction = () => useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      if (!user) throw new Error('User not authenticated');

      // This will work once the reactions column is added to the schema
      console.log('Reaction feature will be available after schema update:', { messageId, reaction });
      
      // For now, just return empty array
      return [];
    },
    onSuccess: () => {
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['conversation', activeConversation] });
      }
    }
  });

  // Get conversation settings - simplified for now
  const useConversationSettings = (otherUserId: string) => useQuery({
    queryKey: ['conversation-settings', otherUserId],
    queryFn: async (): Promise<ConversationSettings | null> => {
      // Will work once conversation_settings table is recognized by TypeScript
      return null;
    },
    enabled: false // Disabled until table is available
  });

  // Update conversation settings - simplified for now
  const useUpdateConversationSettings = () => useMutation({
    mutationFn: async ({ 
      otherUserId, 
      settings 
    }: { 
      otherUserId: string; 
      settings: Partial<ConversationSettings> 
    }) => {
      console.log('Conversation settings will be available after schema update:', { otherUserId, settings });
      return null;
    }
  });

  // Mark conversation as read using existing function
  const useMarkConversationAsRead = () => useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('mark_conversation_as_read_v2', {
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
