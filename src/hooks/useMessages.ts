
import { useMessageQueries } from "./messages/useMessageQueries";
import { useMessageMutations } from "./messages/useMessageMutations";
import { ChatUser, Message, PaginatedMessages } from "./messages/types";

export type { Message, ChatUser, PaginatedMessages };

export const useMessages = () => {
  // Initialize all the hooks
  const { getChatUsers, getConversation, getTotalUnreadCount } = useMessageQueries();
  const { sendMessage, clearConversation, deleteMessage, editMessage } = useMessageMutations();

  // Get data from queries
  const { data: chatUsers = [], isLoading: isLoadingChatUsers } = getChatUsers();

  return {
    chatUsers,
    isLoadingChatUsers,
    getTotalUnreadCount: () => getTotalUnreadCount(chatUsers),
    getConversation,
    sendMessage,
    clearConversation,
    deleteMessage,
    editMessage
  };
};
