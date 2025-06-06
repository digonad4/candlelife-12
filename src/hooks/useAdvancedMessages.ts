
import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './use-toast';
import { useRealtimeSubscription } from './useRealtimeSubscription';

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
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
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

  // Subscription para mensagens em tempo real
  useRealtimeSubscription({
    channelName: 'messages-realtime',
    filters: [
      {
        event: '*',
        schema: 'public', 
        table: 'messages',
        filter: user ? `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})` : undefined
      }
    ],
    onSubscriptionChange: (payload) => {
      console.log('📨 Realtime message update:', payload);
      
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
    dependencies: [user?.id, activeConversation]
  });

  // Query para buscar usuários do chat
  const useChatUsers = () => {
    return useQuery({
      queryKey: ['chat-users', user?.id],
      queryFn: async (): Promise<ChatUser[]> => {
        if (!user) return [];

        const { data, error } = await supabase.rpc('get_chat_users', {
          current_user_id: user.id
        });

        if (error) {
          console.error('Error fetching chat users:', error);
          throw error;
        }

        return data || [];
      },
      enabled: !!user,
      staleTime: 30000,
      gcTime: 300000
    });
  };

  // Query para buscar conversa específica
  const useConversation = (otherUserId: string | null, cursor?: string) => {
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

        return {
          messages: messages.reverse(),
          hasNextPage,
          nextCursor
        };
      },
      enabled: !!user && !!otherUserId,
      staleTime: 10000,
      gcTime: 300000
    });
  };

  // Mutation para enviar mensagem
  const useSendMessage = () => {
    return useMutation({
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
  };

  // Mutation para marcar mensagens como lidas
  const useMarkAsRead = () => {
    return useMutation({
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
  };

  // Mutation para editar mensagem
  const useEditMessage = () => {
    return useMutation({
      mutationFn: async ({ messageId, newContent }: { messageId: string; newContent: string }) => {
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase.rpc('edit_message', {
          p_message_id: messageId,
          p_user_id: user.id,
          p_new_content: newContent
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
  };

  // Mutation para deletar mensagem
  const useDeleteMessage = () => {
    return useMutation({
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
  };

  // Mutation para limpar conversa
  const useClearConversation = () => {
    return useMutation({
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
  };

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

  return {
    // Queries
    useChatUsers,
    useConversation,

    // Mutations
    useSendMessage,
    useMarkAsRead,
    useEditMessage,
    useDeleteMessage,
    useClearConversation,

    // Estado
    activeConversation,
    setActiveConversation,
    typingUsers,

    // Funções
    sendTypingStatus
  };
};
