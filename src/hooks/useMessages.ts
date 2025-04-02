
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export type Message = {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  read: boolean;
  created_at: string;
  sender_profile?: {
    username: string;
    avatar_url: string | null;
  };
  recipient_profile?: {
    username: string;
    avatar_url: string | null;
  };
};

export type ChatUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  unread_count: number;
  last_message?: string;
  last_message_time?: string;
};

export const useMessages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Configurar o canal de tempo real para atualização de mensagens
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          // Quando receber uma nova mensagem
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['chatUsers'] });
          
          const newMessage = payload.new as Message;
          if (newMessage.sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: ['chat', newMessage.sender_id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Buscar todos os usuários com quem o usuário atual tem conversas
  const { data: chatUsers = [], isLoading: isLoadingChatUsers } = useQuery({
    queryKey: ["chatUsers"],
    queryFn: async () => {
      if (!user) return [];

      // Função auxiliar para contar mensagens não lidas
      const countUnreadMessages = async (userId: string) => {
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("sender_id", userId)
          .eq("read", false);

        if (error) {
          console.error("Erro ao contar mensagens não lidas:", error);
          return 0;
        }

        return count || 0;
      };

      // Buscar últimas mensagens enviadas e recebidas
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender_profile:sender_id(username, avatar_url),
          recipient_profile:recipient_id(username, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar mensagens:", error);
        throw error;
      }

      // Encontrar todos os usuários únicos com quem o usuário atual conversou
      const userIds = new Set<string>();
      const userMap = new Map<string, ChatUser>();

      for (const message of messages) {
        const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
        
        if (!userIds.has(otherUserId)) {
          userIds.add(otherUserId);
          
          const profile = message.sender_id === user.id 
            ? message.recipient_profile 
            : message.sender_profile;
            
          if (profile) {
            userMap.set(otherUserId, {
              id: otherUserId,
              username: profile.username,
              avatar_url: profile.avatar_url,
              unread_count: 0,
              last_message: message.content,
              last_message_time: message.created_at
            });
          }
        }
      }

      // Adicionar contagem de mensagens não lidas para cada usuário
      const chatUsersWithUnread = await Promise.all(
        Array.from(userMap.values()).map(async (chatUser) => {
          const unreadCount = await countUnreadMessages(chatUser.id);
          return {
            ...chatUser,
            unread_count: unreadCount
          };
        })
      );

      // Ordenar por mensagens não lidas (decrescente) e depois por hora da última mensagem (decrescente)
      return chatUsersWithUnread.sort((a, b) => {
        if (a.unread_count !== b.unread_count) {
          return b.unread_count - a.unread_count;
        }
        
        const dateA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const dateB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        return dateB - dateA;
      });
    },
    enabled: !!user,
  });

  // Contar total de mensagens não lidas
  const getTotalUnreadCount = (): number => {
    if (!chatUsers) return 0;
    return chatUsers.reduce((total, chatUser) => total + chatUser.unread_count, 0);
  };

  // Buscar mensagens de uma conversa específica
  const getConversation = (userId: string) => {
    return useQuery({
      queryKey: ["chat", userId],
      queryFn: async () => {
        if (!user) return [];

        // Marcar mensagens como lidas quando a conversa é aberta
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("recipient_id", user.id)
          .eq("sender_id", userId);

        // Invalidar a query de chat users para atualizar a contagem de não lidos
        queryClient.invalidateQueries({ queryKey: ["chatUsers"] });

        // Buscar todas as mensagens da conversa
        const { data, error } = await supabase
          .from("messages")
          .select(`
            *,
            sender_profile:sender_id(username, avatar_url),
            recipient_profile:recipient_id(username, avatar_url)
          `)
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Erro ao buscar mensagens da conversa:", error);
          throw error;
        }

        return data || [];
      },
      enabled: !!user && !!userId,
    });
  };

  // Enviar uma nova mensagem
  const sendMessage = useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      if (!user) throw new Error("Usuário não autenticado");
      if (recipientId === user.id) throw new Error("Você não pode enviar mensagens para si mesmo");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          read: false
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao enviar mensagem:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (newMessage) => {
      // Atualizar a lista de conversas
      queryClient.invalidateQueries({ queryKey: ["chatUsers"] });
      // Atualizar a conversa específica
      queryClient.invalidateQueries({ queryKey: ["chat", newMessage.recipient_id] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível enviar a mensagem: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    chatUsers,
    isLoadingChatUsers,
    getTotalUnreadCount,
    getConversation,
    sendMessage
  };
};
