
import { useMessageQueries } from "./messages/useMessageQueries";
import { useMessageMutations } from "./messages/useMessageMutations";
import { useMessageRealtime } from "./messages/useMessageRealtime";
import { ChatUser, Message } from "./messages/types";

export type { Message, ChatUser };

export const useMessages = () => {
  // Initialize all the hooks
  const { getChatUsers, getConversation, getTotalUnreadCount } = useMessageQueries();
  const { sendMessage, clearConversation, deleteMessage, editMessage } = useMessageMutations();
  useMessageRealtime();

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
