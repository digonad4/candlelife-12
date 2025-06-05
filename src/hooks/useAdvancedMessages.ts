<<<<<<< HEAD

import { useAuth } from "@/context/AuthContext";
import { useMessages } from "./useMessages";
import { useMessageRead } from "./messages/useMessageRead";

export const useAdvancedMessages = () => {
  const { user } = useAuth();
  const { 
    chatUsers, 
    isLoadingChatUsers, 
    getConversation, 
    sendMessage, 
    clearConversation, 
    deleteMessage, 
    editMessage 
  } = useMessages();

  const { markConversationAsRead } = useMessageRead();

  // Calculate total unread count with null safety
  const getTotalUnreadCount = (): number => {
    if (!chatUsers || !Array.isArray(chatUsers)) return 0;
    return chatUsers.reduce((total, chatUser) => {
      const unreadCount = chatUser?.unread_count || 0;
      return total + unreadCount;
    }, 0);
  };

  // Get chat users query with error handling
  const getChatUsers = {
    data: chatUsers || [],
    isLoading: isLoadingChatUsers
  };

  // Create conversation function that handles the user ID properly
  const createConversation = (recipientId: string, page: number = 1, pageSize: number = 20, searchQuery: string = "") => {
    console.log("createConversation called with:", { recipientId, page, pageSize, searchQuery, userId: user?.id });
    
    if (!user?.id || !recipientId) {
      console.warn("No user ID or recipient ID available for conversation");
      return { 
        data: { messages: [], hasMore: false, totalCount: 0 }, 
        isLoading: false, 
        isError: true,
        error: new Error("Missing user or recipient ID")
      };
    }
    
    const conversationQuery = getConversation(recipientId, page, pageSize, searchQuery);
    console.log("Conversation query result:", conversationQuery);
    
    return conversationQuery;
  };

  return {
    chatUsers: chatUsers || [],
    isLoadingChatUsers,
    getTotalUnreadCount,
    getChatUsers,
    getConversation: createConversation,
    sendMessage,
    clearConversation,
    deleteMessage,
    editMessage,
    markConversationAsRead
=======
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Message, ChatUser } from "@/types/social";
import { notificationService } from "@/services/notificationService";
import { useRealtimeSubscription } from "./useRealtimeSubscription";

export const useAdvancedMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Inicializar serviço de notificações
  useEffect(() => {
    notificationService.initialize();
  }, []);

  // Usar o novo hook para subscription
  useRealtimeSubscription({
    channelName: 'advanced-messages',
    filters: [
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${user?.id || ''}`
      }
    ],
    onSubscriptionChange: async (payload) => {
      console.log("Nova mensagem recebida:", payload);
      
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat-users'] });
      
      const newMessage = payload.new as Message;
      if (newMessage.sender_id !== user?.id) {
        queryClient.invalidateQueries({ queryKey: ['conversation', newMessage.sender_id] });
        
        const { data: senderData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', newMessage.sender_id)
          .single();

        if (senderData) {
          // Mostrar notificação
          notificationService.showNotification(newMessage, senderData);
          
          // Atualizar badge count
          const { data: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('recipient_id', user?.id)
            .eq('read', false);
          
          notificationService.updateBadgeCount(unreadCount?.length || 0);
        }
      }
    },
    dependencies: [user?.id]
  });

  // Buscar conversas do usuário
  const getChatUsers = useQuery({
    queryKey: ['chat-users', user?.id],
    queryFn: async (): Promise<ChatUser[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          recipient:profiles!messages_recipient_id_fkey(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('is_soft_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar mensagens por conversa
      const conversationMap = new Map<string, ChatUser>();
      
      data?.forEach((message: any) => {
        const otherUser = message.sender_id === user.id ? message.recipient : message.sender;
        const conversationId = otherUser.id;
        
        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            id: otherUser.id,
            username: otherUser.username,
            avatar_url: otherUser.avatar_url,
            last_message: message,
            unread_count: 0
          });
        }

        // Atualizar contagem de não lidas
        if (message.recipient_id === user.id && !message.read) {
          const chatUser = conversationMap.get(conversationId)!;
          chatUser.unread_count++;
        }
      });

      return Array.from(conversationMap.values());
    },
    enabled: !!user
  });

  // Buscar mensagens de uma conversa específica
  const getConversation = (recipientId: string, page = 1, pageSize = 20, searchQuery = "") => {
    return useQuery({
      queryKey: ['conversation', recipientId, page, pageSize, searchQuery],
      queryFn: async () => {
        if (!user) return { messages: [], totalCount: 0, hasMore: false };

        let query = supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(username, avatar_url)
          `)
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
          .eq('is_soft_deleted', false)
          .order('created_at', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (searchQuery) {
          query = query.ilike('content', `%${searchQuery}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        const messages = (data || []).reverse().map((msg: any) => ({
          ...msg,
          sender_username: msg.sender?.username,
          sender_avatar_url: msg.sender?.avatar_url
        }));

        return {
          messages,
          totalCount: count || 0,
          hasMore: (count || 0) > page * pageSize
        };
      },
      enabled: !!user && !!recipientId
    });
  };

  // Enviar mensagem
  const sendMessage = useMutation({
    mutationFn: async ({ recipientId, content, attachment }: {
      recipientId: string;
      content: string;
      attachment?: File;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      let attachmentUrl: string | null = null;
      
      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, attachment);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          attachment_url: attachmentUrl,
          message_status: 'sending'
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: ['chat-users'] });
    }
  });

  // Editar mensagem
  const editMessage = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.rpc('edit_message', {
        p_message_id: messageId,
        p_user_id: user.id,
        p_new_content: content
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      toast({ title: "Mensagem editada com sucesso" });
    }
  });

  // Excluir mensagem
  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.rpc('soft_delete_message', {
        p_message_id: messageId,
        p_user_id: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      toast({ title: "Mensagem excluída" });
    }
  });

  // Marcar mensagem como lida
  const markAsRead = useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.rpc('mark_message_as_read_v2', {
        p_message_id: messageId,
        p_user_id: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: ['chat-users'] });
    }
  });

  // Marcar conversa como lida
  const markConversationAsRead = useMutation({
    mutationFn: async ({ recipientId, senderId }: { recipientId: string; senderId: string }) => {
      const { error } = await supabase.rpc('mark_conversation_as_read_v2', {
        p_recipient_id: recipientId,
        p_sender_id: senderId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: ['chat-users'] });
    }
  });

  // Limpar conversa
  const clearConversation = useMutation({
    mutationFn: async (recipientId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.rpc('clear_conversation', {
        p_user_id: user.id,
        p_other_user_id: recipientId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: ['chat-users'] });
    }
  });

  // Calcular total de mensagens não lidas
  const getTotalUnreadCount = (): number => {
    const chatUsers = getChatUsers.data || [];
    return chatUsers.reduce((total, user) => total + user.unread_count, 0);
  };

  return {
    // Queries
    getChatUsers,
    getConversation,
    
    // Mutations
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    markConversationAsRead,
    clearConversation,
    
    // Utilities
    getTotalUnreadCount,
    
    // Loading states
    isLoadingChatUsers: getChatUsers.isLoading,
    
    // Notification service
    notificationService
>>>>>>> a54c83b6aeb620917159af6bd1e06b32ec0fcdef
  };
};
