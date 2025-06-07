
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

  // Get conversation with enhanced features
  const useConversation = useCallback((otherUserId: string, searchTerm?: string) => {
    return useQuery({
      queryKey: ['conversation', otherUserId, searchTerm],
      queryFn: async (): Promise<EnhancedMessage[]> => {
        if (!user || !otherUserId) return [];

        // Use regular query since the RPC function may not be available yet
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
            reactions,
            message_type,
            attachment_url,
            file_name,
            file_size,
            duration,
            profiles:sender_id(username, avatar_url)
          `)
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
          .eq('is_soft_deleted', false)
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
          reactions: msg.reactions || [],
          message_type: (msg.message_type as 'text' | 'image' | 'file' | 'audio' | 'video' | 'location') || 'text',
          attachment_url: msg.attachment_url || undefined,
          file_name: msg.file_name || undefined,
          file_size: msg.file_size || undefined,
          duration: msg.duration || undefined,
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

  // Add message reaction - using simple update for now
  const useToggleReaction = () => useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Get current reactions
      const { data: message } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      if (!message) throw new Error('Message not found');

      const currentReactions = message.reactions || [];
      const userReactionIndex = currentReactions.findIndex(
        (r: any) => r.user_id === user.id
      );

      let newReactions;
      if (userReactionIndex === -1) {
        // Add new reaction
        newReactions = [...currentReactions, { user_id: user.id, reaction }];
      } else if (currentReactions[userReactionIndex].reaction === reaction) {
        // Remove existing reaction
        newReactions = currentReactions.filter((r: any) => r.user_id !== user.id);
      } else {
        // Update existing reaction
        newReactions = currentReactions.map((r: any) => 
          r.user_id === user.id ? { ...r, reaction } : r
        );
      }

      const { error } = await supabase
        .from('messages')
        .update({ reactions: newReactions })
        .eq('id', messageId);

      if (error) throw error;
      return newReactions;
    },
    onSuccess: () => {
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['conversation', activeConversation] });
      }
    }
  });

  // Get conversation settings - temporarily disabled until table is recognized
  const useConversationSettings = (otherUserId: string) => useQuery({
    queryKey: ['conversation-settings', otherUserId],
    queryFn: async (): Promise<ConversationSettings | null> => {
      // Temporarily return null until the table is properly recognized by TypeScript
      return null;
    },
    enabled: false // Disabled until table is available
  });

  // Update conversation settings - temporarily disabled
  const useUpdateConversationSettings = () => useMutation({
    mutationFn: async ({ 
      otherUserId, 
      settings 
    }: { 
      otherUserId: string; 
      settings: Partial<ConversationSettings> 
    }) => {
      throw new Error('Not implemented yet');
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
