

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  read_at?: string;
  message_status?: string;
  attachment_url?: string;
  edited_at?: string;
  is_soft_deleted?: boolean;
  deleted_by_recipient?: boolean;
  sender_profile?: {
    username: string;
    avatar_url?: string;
  };
}

export interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string;
  unread_count: number;
  last_message?: Message;
}

export interface ConversationData {
  messages: Message[];
  totalCount: number;
  hasMore: boolean;
}

export const useOptimizedMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get chat users with unread counts
  const getChatUsers = useQuery({
    queryKey: ["chat-users", user?.id],
    queryFn: async (): Promise<ChatUser[]> => {
      if (!user?.id) return [];

      // Get all users who have exchanged messages with current user
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(`
          sender_id,
          recipient_id,
          content,
          created_at,
          read
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

        const lastMessage = userMessages[0] ? {
          id: userMessages[0].sender_id + userMessages[0].created_at,
          sender_id: userMessages[0].sender_id,
          recipient_id: userMessages[0].recipient_id,
          content: userMessages[0].content,
          created_at: userMessages[0].created_at,
          read: userMessages[0].read,
        } as Message : undefined;

        return {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url || undefined,
          unread_count: unreadCount,
          last_message: lastMessage
        };
      }) || [];

      return chatUsers.sort((a, b) => {
        const aTime = a.last_message?.created_at || '';
        const bTime = b.last_message?.created_at || '';
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchOnWindowFocus: true
  });

  // Get conversation messages
  const getConversation = useCallback((
    recipientId: string,
    page: number = 1,
    pageSize: number = 20,
    searchQuery: string = ""
  ) => {
    return useQuery({
      queryKey: ["conversation", user?.id, recipientId, page, pageSize, searchQuery],
      queryFn: async (): Promise<ConversationData> => {
        if (!user?.id || !recipientId) {
          return { messages: [], totalCount: 0, hasMore: false };
        }

        let query = supabase
          .from("messages")
          .select("*", { count: "exact" })
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
          .eq("deleted_by_recipient", false)
          .eq("is_soft_deleted", false)
          .order("created_at", { ascending: false });

        if (searchQuery) {
          query = query.ilike("content", `%${searchQuery}%`);
        }

        const offset = (page - 1) * pageSize;
        query = query.range(offset, offset + pageSize - 1);

        const { data: messagesData, error, count } = await query;

        if (error) {
          console.error("Error fetching conversation:", error);
          throw error;
        }

        // Get sender profiles for messages
        const messages: Message[] = [];
        if (messagesData) {
          for (const msg of messagesData) {
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", msg.sender_id)
              .single();

            messages.push({
              ...msg,
              attachment_url: msg.attachment_url || undefined,
              read_at: msg.read_at || undefined,
              edited_at: msg.edited_at || undefined,
              message_status: msg.message_status || undefined,
              is_soft_deleted: msg.is_soft_deleted || undefined,
              deleted_by_recipient: msg.deleted_by_recipient || undefined,
              sender_profile: senderProfile ? {
                username: senderProfile.username,
                avatar_url: senderProfile.avatar_url || undefined
              } : undefined
            });
          }
        }

        return {
          messages: messages.reverse(),
          totalCount: count || 0,
          hasMore: count ? count > page * pageSize : false
        };
      },
      enabled: !!user?.id && !!recipientId,
      staleTime: 0,
      refetchOnWindowFocus: false
    });
  }, [user?.id]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ recipientId, content, attachment }: {
      recipientId: string;
      content: string;
      attachment?: File;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      let attachment_url: string | undefined = undefined;
      
      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('messages')
          .upload(fileName, attachment);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('messages')
          .getPublicUrl(fileName);
          
        attachment_url = publicUrl;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          attachment_url
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-users"] });
      queryClient.invalidateQueries({ 
        queryKey: ["conversation", user?.id, variables.recipientId] 
      });
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Falha ao enviar mensagem: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mark conversation as read
  const markConversationAsRead = useMutation({
    mutationFn: async ({ recipientId, senderId }: {
      recipientId: string;
      senderId: string;
    }) => {
      const { error } = await supabase.rpc('mark_conversation_as_read_v2', {
        p_recipient_id: recipientId,
        p_sender_id: senderId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-users"] });
    }
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase.rpc('soft_delete_message', {
        p_message_id: messageId,
        p_user_id: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
      queryClient.invalidateQueries({ queryKey: ["chat-users"] });
      
      toast({
        title: "Mensagem excluída",
        description: "A mensagem foi excluída com sucesso."
      });
    }
  });

  const editMessage = useMutation({
    mutationFn: async ({ messageId, content }: {
      messageId: string;
      content: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase.rpc('edit_message', {
        p_message_id: messageId,
        p_user_id: user.id,
        p_new_content: content
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
      
      toast({
        title: "Mensagem editada",
        description: "A mensagem foi editada com sucesso."
      });
    }
  });

  const clearConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase.rpc('clear_conversation', {
        p_user_id: user.id,
        p_other_user_id: otherUserId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
      queryClient.invalidateQueries({ queryKey: ["chat-users"] });
      
      toast({
        title: "Conversa limpa",
        description: "Todas as mensagens foram removidas."
      });
    }
  });

  // Calculate total unread count
  const getTotalUnreadCount = useCallback((): number => {
    const chatUsers = getChatUsers.data || [];
    return chatUsers.reduce((total, user) => total + (user.unread_count || 0), 0);
  }, [getChatUsers.data]);

  return {
    // Data
    chatUsers: getChatUsers.data || [],
    isLoadingChatUsers: getChatUsers.isLoading,
    
    // Functions
    getConversation,
    getTotalUnreadCount,
    
    // Mutations
    sendMessage,
    markConversationAsRead,
    deleteMessage,
    editMessage,
    clearConversation
  };
};
