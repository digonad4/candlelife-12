
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMessagesContext } from "../types";
import { Message } from "../types";

export const useConversationQuery = () => {
  const { user } = useMessagesContext();
  const queryClient = useQueryClient();

  const getConversation = (userId: string, page = 1, pageSize = 20) => {
    return useQuery({
      queryKey: ["chat", userId, page, pageSize],
      queryFn: async () => {
        if (!user || !userId) return { messages: [], totalCount: 0, hasMore: false };

        // Marcar mensagens como lidas
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("recipient_id", user.id)
          .eq("sender_id", userId);

        queryClient.invalidateQueries({ queryKey: ["chatUsers"] });

        // Obter contagem total primeiro
        const { count: totalCount, error: countError } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .or(
            `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),` + 
            `and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
          )
          .eq("deleted_by_recipient", false);

        if (countError) {
          console.error("Error counting messages:", countError);
          throw countError;
        }

        // Calcular offset com base na página e tamanho da página
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Buscar mensagens paginadas
        const { data: messagesData, error } = await supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),` + 
            `and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
          )
          .eq("deleted_by_recipient", false)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) {
          console.error("Erro ao buscar mensagens da conversa:", error);
          throw error;
        }

        // Filtrar mensagens excluídas pelo destinatário e ordenar cronologicamente
        const filteredMessages = messagesData?.filter(msg => {
          if (msg.recipient_id === user.id) {
            return !msg.deleted_by_recipient;
          }
          return true;
        }) || [];

        // Invertemos a ordem para exibição (buscamos em ordem decrescente para paginação)
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

        console.log(`Messages loaded: ${messagesWithProfiles.length}, Page: ${page}, Total: ${totalCount}`);
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
