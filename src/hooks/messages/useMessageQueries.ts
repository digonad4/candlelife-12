
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMessagesContext } from "./types";
import { ChatUser, Message } from "./types";

export const useMessageQueries = () => {
  const { user } = useMessagesContext();
  const queryClient = useQueryClient();

  const getChatUsers = () => {
    return useQuery({
      queryKey: ["chatUsers"],
      queryFn: async () => {
        if (!user) return [];

        const countUnreadMessages = async (userId: string) => {
          const { count, error } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("recipient_id", user.id)
            .eq("sender_id", userId)
            .eq("read", false)
            .eq("deleted_by_recipient", false);

          if (error) {
            console.error("Erro ao contar mensagens não lidas:", error);
            return 0;
          }

          return count || 0;
        };

        const { data: messages, error } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .eq("deleted_by_recipient", false)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar mensagens:", error);
          throw error;
        }

        const userIds = new Set<string>();
        const userMap = new Map<string, ChatUser>();

        for (const message of messages || []) {
          const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
          
          if (!userIds.has(otherUserId)) {
            userIds.add(otherUserId);
            
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", otherUserId)
              .single();
              
            if (profileData) {
              userMap.set(otherUserId, {
                id: otherUserId,
                username: profileData.username,
                avatar_url: profileData.avatar_url,
                unread_count: 0,
                last_message: message.content,
                last_message_time: message.created_at
              });
            }
          }
        }

        const chatUsersWithUnread = await Promise.all(
          Array.from(userMap.values()).map(async (chatUser) => {
            const unreadCount = await countUnreadMessages(chatUser.id);
            return {
              ...chatUser,
              unread_count: unreadCount
            };
          })
        );

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
  };

  const getConversation = (userId: string) => {
    return useQuery({
      queryKey: ["chat", userId],
      queryFn: async () => {
        if (!user || !userId) return [];

        // Mark messages as read
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("recipient_id", user.id)
          .eq("sender_id", userId);

        queryClient.invalidateQueries({ queryKey: ["chatUsers"] });

        // Fix the query to properly filter messages between the two users
        const { data: messagesData, error } = await supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),` + 
            `and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
          )
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Erro ao buscar mensagens da conversa:", error);
          throw error;
        }

        // Filter out messages deleted by recipient
        const filteredMessages = messagesData?.filter(msg => {
          if (msg.recipient_id === user.id) {
            return !msg.deleted_by_recipient;
          }
          return true;
        }) || [];

        const messagesWithProfiles = await Promise.all(
          filteredMessages.map(async (message) => {
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", message.sender_id)
              .single();

            const { data: recipientProfile } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", message.recipient_id)
              .single();

            return {
              ...message,
              deleted_by_recipient: message.deleted_by_recipient || false,
              sender_profile: senderProfile || { 
                username: "Usuário desconhecido", 
                avatar_url: null 
              },
              recipient_profile: recipientProfile || { 
                username: "Usuário desconhecido", 
                avatar_url: null 
              }
            };
          })
        );

        console.log("Messages loaded:", messagesWithProfiles.length);
        return messagesWithProfiles;
      },
      enabled: !!user && !!userId,
    });
  };

  const getTotalUnreadCount = (chatUsers: ChatUser[]): number => {
    if (!chatUsers) return 0;
    return chatUsers.reduce((total, chatUser) => total + chatUser.unread_count, 0);
  };

  return {
    getChatUsers,
    getConversation,
    getTotalUnreadCount
  };
};
