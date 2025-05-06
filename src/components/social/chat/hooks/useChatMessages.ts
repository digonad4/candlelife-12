
import { useState, useEffect } from "react";
import { useMessages } from "@/hooks/useMessages"; 
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTypingIndicator } from "@/hooks/messages/useTypingIndicator";
import { Message } from "@/hooks/messages/types";

interface UseChatMessagesProps {
  recipientId: string;
  isOpen: boolean;
}

export const useChatMessages = ({ recipientId, isOpen }: UseChatMessagesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const pageSize = 20;
  
  const { getConversation, sendMessage, clearConversation, deleteMessage, editMessage } = useMessages();
  const { sendTypingStatus, isUserTyping } = useTypingIndicator();
  
  const { 
    data: conversationData = { messages: [], totalCount: 0, hasMore: false }, 
    isLoading, 
    isError, 
    refetch 
  } = getConversation(recipientId, currentPage, pageSize, searchQuery);
  
  // Extract the messages data
  const messages = conversationData.messages || [];
  const { totalCount, hasMore } = conversationData;
  
  // Check if recipient is typing
  const recipientIsTyping = isUserTyping(recipientId);

  // Initialize chat and fetch messages when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setSearchQuery("");
      refetch();
    }
  }, [isOpen, refetch]);

  // Handle search
  const handleSearch = (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
    setCurrentPage(1);
    
    // Reset search state after results load
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  const handleSendMessage = (content: string, attachment: File | null): boolean => {
    if ((!content.trim() && !attachment) || !user) return false;

    try {
      sendMessage.mutate(
        { recipientId, content: content.trim() || " ", attachment },
        {
          onSuccess: () => {
            sendTypingStatus(recipientId, false);
            refetch();
          },
          onError: (error) => {
            toast({
              title: "Erro",
              description: `Não foi possível enviar a mensagem: ${error.message}`,
              variant: "destructive",
            });
          }
        }
      );
      return true;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      return false;
    }
  };

  const handleClearConversation = () => {
    clearConversation.mutate(recipientId, {
      onSuccess: () => {
        setCurrentPage(1);
        refetch();
        toast({
          title: "Conversa limpa",
          description: "Todas as mensagens foram removidas."
        });
        return true;
      }
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage.mutate(messageId, {
      onSuccess: () => {
        refetch();
        toast({
          title: "Mensagem excluída",
          description: "A mensagem foi excluída com sucesso."
        });
      }
    });
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    editMessage.mutate(
      { messageId, content: newContent },
      {
        onSuccess: () => {
          refetch();
        }
      }
    );
  };

  const handleLoadMoreMessages = async () => {
    if (hasMore && !isFetchingMore) {
      setIsFetchingMore(true);
      setCurrentPage(prev => prev + 1);
      await refetch();
      setIsFetchingMore(false);
    }
  };
  
  const handleTypingStatusChange = (isTyping: boolean) => {
    sendTypingStatus(recipientId, isTyping);
  };

  return {
    messages,
    isLoading,
    isLoadingMore: isFetchingMore,
    isError,
    hasMore,
    totalCount,
    recipientIsTyping,
    searchQuery,
    isSearching,
    sendMessageIsPending: sendMessage.isPending,
    clearConversationIsPending: clearConversation.isPending,
    handleSearch,
    handleSendMessage,
    handleClearConversation,
    handleDeleteMessage,
    handleEditMessage,
    handleLoadMoreMessages,
    handleTypingStatusChange
  };
};
