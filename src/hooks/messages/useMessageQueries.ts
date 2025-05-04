
import { useConversationQuery } from "./queries/useConversationQuery";
import { useChatUsersQuery } from "./queries/useChatUsersQuery";
import { ChatUser } from "./types";

export const useMessageQueries = () => {
  const { getConversation } = useConversationQuery();
  const { getChatUsers } = useChatUsersQuery();

  // Função para calcular o total de mensagens não lidas
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
