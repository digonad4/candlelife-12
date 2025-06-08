
import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read: boolean;
  attachment_url?: string;
  edited_at?: string;
  is_soft_deleted?: boolean;
  reply_to_id?: string;
  message_status: 'sending' | 'sent' | 'delivered' | 'read';
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string;
  last_message?: Message;
  last_message_at?: string;
  unread_count: number;
}

interface ConversationData {
  messages: Message[];
  hasNextPage: boolean;
  nextCursor?: string;
}

const MESSAGES_PER_PAGE = 20;

export const useAdvancedMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Query para buscar usuários do chat
  const useChatUsers = () => useQuery({
    queryKey: ['chat-users', user?.id],
    queryFn: async (): Promise<ChatUser[]> => {
      if (!user) return [];

      // Get all users who have exchanged messages with current user
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(`
          sender_id,
          recipient_id,
          content,
          created_at,
          read,
          id,
          message_status
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        return [];
      }

      // Get unique user IDs who have chatted with current user
      const userIds = new Set<string>();
      messagesData?.forEach(msg => {
        if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
        if (msg.recipient_id !== user.id) userIds.add(msg.recipient_id);
      });

      if (userIds.size === 0) return [];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", Array.from(userIds));

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return [];
      }

      // Calculate unread counts and last messages for each user
      const chatUsers: ChatUser[] = profiles?.map(profile => {
        const userMessages = messagesData?.filter(msg => 
          (msg.sender_id === profile.id && msg.recipient_id === user.id) ||
          (msg.sender_id === user.id && msg.recipient_id === profile.id)
        ) || [];

        const unreadCount = userMessages.filter(msg => 
          msg.recipient_id === user.id && !msg.read
        ).length;

        const lastMessageData = userMessages[0];
        const lastMessage: Message | undefined = lastMessageData ? {
          id: lastMessageData.id,
          content: lastMessageData.content,
          sender_id: lastMessageData.sender_id,
          recipient_id: lastMessageData.recipient_id,
          created_at: lastMessageData.created_at,
          read: lastMessageData.read,
          message_status: (lastMessageData.message_status as 'sending' | 'sent' | 'delivered' | 'read') || 'sent'
        } : undefined;

        return {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url || undefined,
          unread_count: unreadCount,
          last_message: lastMessage,
          last_message_at: lastMessageData?.created_at
        };
      }) || [];

      return chatUsers.sort((a, b) => {
        const aTime = a.last_message_at || '';
        const bTime = b.last_message_at || '';
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    },
    enabled: !!user,
    staleTime: 30000,
    gcTime: 300000
  });

  // Query para buscar conversa específica
  const useConversation = useCallback((otherUserId: string | null, cursor?: string) => {
    return useQuery({
      queryKey: ['conversation', otherUserId, cursor],
      queryFn: async (): Promise<ConversationData> => {
        if (!user || !otherUserId) {
          return { messages: [], hasNextPage: false };
        }

        let query = supabase
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            recipient_id,
            created_at,
            read,
            attachment_url,
            edited_at,
            is_soft_deleted,
            reply_to_id,
            message_status,
            profiles:sender_id(username, avatar_url)
          `)
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
          .eq('is_soft_deleted', false)
          .order('created_at', { ascending: false })
          .limit(MESSAGES_PER_PAGE + 1);

        if (cursor) {
          query = query.lt('created_at', cursor);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching conversation:', error);
          throw error;
        }

        const messages = (data || []).slice(0, MESSAGES_PER_PAGE);
        const hasNextPage = (data || []).length > MESSAGES_PER_PAGE;
        const nextCursor = hasNextPage ? messages[messages.length - 1]?.created_at : undefined;

        // Transform data to match Message interface
        const transformedMessages: Message[] = messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          recipient_id: msg.recipient_id,
          created_at: msg.created_at,
          read: msg.read,
          attachment_url: msg.attachment_url || undefined,
          edited_at: msg.edited_at || undefined,
          is_soft_deleted: msg.is_soft_deleted || undefined,
          reply_to_id: msg.reply_to_id || undefined,
          message_status: (msg.message_status as 'sending' | 'sent' | 'delivered' | 'read') || 'sent',
          profiles: Array.isArray(msg.profiles) && msg.profiles.length > 0 ? msg.profiles[0] : undefined
        })).reverse();

        return {
          messages: transformedMessages,
          hasNextPage,
          nextCursor
        };
      },
      enabled: !!user && !!otherUserId,
      staleTime: 10000,
      gcTime: 300000
    });
  }, [user]);

  // Mutation para enviar mensagem
  const useSendMessage = () => useMutation({
    mutationFn: async ({ 
      recipientId, 
      content, 
      attachmentUrl,
      replyToId 
    }: { 
      recipientId: string; 
      content: string; 
      attachmentUrl?: string;
      replyToId?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          attachment_url: attachmentUrl,
          reply_to_id: replyToId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['chat-users']
      });
      if (activeConversation) {
        queryClient.invalidateQueries({
          queryKey: ['conversation', activeConversation]
        });
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    }
  });

  // Mutation para marcar mensagens como lidas
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
      queryClient.invalidateQueries({
        queryKey: ['chat-users']
      });
    }
  });

  // Mutation para editar mensagem
  const useEditMessage = () => useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('edit_message', {
        p_message_id: messageId,
        p_user_id: user.id,
        p_new_content: content
      });

      if (error) throw error;
    },
    onSuccess: () => {
      if (activeConversation) {
        queryClient.invalidateQueries({
          queryKey: ['conversation', activeConversation]
        });
      }
    }
  });

  // Mutation para deletar mensagem
  const useDeleteMessage = () => useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('soft_delete_message', {
        p_message_id: messageId,
        p_user_id: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      if (activeConversation) {
        queryClient.invalidateQueries({
          queryKey: ['conversation', activeConversation]
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['chat-users']
      });
    }
  });

  // Mutation para limpar conversa
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
      if (activeConversation) {
        queryClient.invalidateQueries({
          queryKey: ['conversation', activeConversation]
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['chat-users']
      });
    }
  });

  // Função para enviar status de digitação
  const sendTypingStatus = useCallback(async (otherUserId: string, isTyping: boolean) => {
    if (!user) return;

    try {
      await supabase.rpc('update_typing_status', {
        p_user_id: user.id,
        p_conversation_with_user_id: otherUserId,
        p_is_typing: isTyping
      });

      if (isTyping) {
        const timeoutKey = `${user.id}-${otherUserId}`;
        
        if (typingTimeouts.current.has(timeoutKey)) {
          clearTimeout(typingTimeouts.current.get(timeoutKey)!);
        }

        const timeout = setTimeout(() => {
          sendTypingStatus(otherUserId, false);
        }, 3000);

        typingTimeouts.current.set(timeoutKey, timeout);
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [user]);

  // Function to get total unread count
  const getTotalUnreadCount = useCallback((): number => {
    const chatUsersQuery = useChatUsers();
    const chatUsers = chatUsersQuery.data || [];
    return chatUsers.reduce((total, user) => total + (user.unread_count || 0), 0);
  }, []);

  return {
    // Hooks (queries and mutations)
    useChatUsers,
    useConversation,
    useSendMessage,
    useMarkConversationAsRead,
    useEditMessage,
    useDeleteMessage,
    useClearConversation,

    // Estado
    activeConversation,
    setActiveConversation,
    typingUsers,

    // Funções
    sendTypingStatus,
    getTotalUnreadCount
  };
};
