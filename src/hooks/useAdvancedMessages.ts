
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
  };
};
