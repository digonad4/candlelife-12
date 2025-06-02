
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Message, PaginatedMessages } from "../types";

export const useConversationQuery = (
  recipientId: string,
  currentPage: number = 1,
  pageSize: number = 20,
  searchQuery: string = ""
) => {
  return useQuery({
    queryKey: ["chat", recipientId, currentPage, pageSize, searchQuery],
    queryFn: async (): Promise<PaginatedMessages> => {
      console.log("useConversationQuery - Fetching conversation", {
        recipientId,
        currentPage,
        pageSize,
        searchQuery
      });

      if (!recipientId) {
        return { messages: [], totalCount: 0, hasMore: false };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      let query = supabase
        .from("messages")
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(username, avatar_url)
        `, { count: "exact" })
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .eq("deleted_by_recipient", false)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("content", `%${searchQuery}%`);
      }

      const offset = (currentPage - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data: messagesData, error, count } = await query;

      if (error) {
        console.error("useConversationQuery - Error fetching messages:", error);
        throw error;
      }

      // Transformar os dados para incluir informações do remetente
      const messages = (messagesData || []).map((msg: any) => ({
        ...msg,
        sender_username: msg.sender_profile?.username,
        sender_avatar_url: msg.sender_profile?.avatar_url
      }));

      console.log("useConversationQuery - Fetched messages:", {
        messagesCount: messages?.length || 0,
        totalCount: count || 0
      });

      return {
        messages: messages.reverse() as Message[],
        totalCount: count || 0,
        hasMore: count ? count > currentPage * pageSize : false
      };
    },
    enabled: !!recipientId,
    staleTime: 0,
    refetchOnWindowFocus: false
  });
};
