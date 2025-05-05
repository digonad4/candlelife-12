
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMessagesContext } from "../types";
import { Message } from "../types";

export const useConversationQuery = () => {
  const { user } = useMessagesContext();
  const queryClient = useQueryClient();

  const getConversation = (userId: string, page = 1, pageSize = 20, searchQuery = '') => {
    return useQuery({
      queryKey: ["chat", userId, page, pageSize, searchQuery],
      queryFn: async () => {
        if (!user || !userId) return { messages: [], totalCount: 0, hasMore: false };

        // Marcar mensagens como lidas
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("recipient_id", user.id)
          .eq("sender_id", userId);

        queryClient.invalidateQueries({ queryKey: ["chatUsers"] });

        let query = supabase
          .from("messages")
          .select("*", { count: "exact" })
          .or(
            `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),` + 
            `and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
          )
          .eq("deleted_by_recipient", false);
          
        // Add search filter if provided
        if (searchQuery) {
          query = query.ilike('content', `%${searchQuery}%`);
        }

        // Get count first
        const { count: totalCount, error: countError } = await query;

        if (countError) {
          console.error("Error counting messages:", countError);
          throw countError;
        }

        // Calculate offset for pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Execute the same query but with pagination and ordering
        let { data: messagesData, error } = await query
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) {
          console.error("Erro ao buscar mensagens da conversa:", error);
          throw error;
        }

        // Filter deleted messages and reverse for chronological order
        const filteredMessages = messagesData?.filter(msg => {
          if (msg.recipient_id === user.id) {
            return !msg.deleted_by_recipient;
          }
          return true;
        }) || [];

        // Invertemos a ordem para exibição (chronological)
        filteredMessages.reverse();

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

        const hasMore = from + messagesWithProfiles.length < (totalCount || 0);

        return { 
          messages: messagesWithProfiles,
          totalCount: totalCount || 0,
          hasMore
        };
      },
      enabled: !!user && !!userId,
    });
  };

  return {
    getConversation
  };
};
