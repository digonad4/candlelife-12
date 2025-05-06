
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
    console.log("handleSendMessage called", { content, attachment, user });
    
    if ((!content.trim() && !attachment)) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem ou anexe um arquivo para enviar",
        variant: "destructive",
      });
      return false;
    }
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para enviar mensagens",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log("Sending message...", { recipientId, content, attachment });
      
      sendMessage.mutate(
        { recipientId, content: content.trim() || " ", attachment },
        {
          onSuccess: () => {
            console.log("Message sent successfully");
            sendTypingStatus(recipientId, false);
            refetch();
            return true;
          },
          onError: (error: any) => {
            console.error("Erro ao enviar mensagem:", error);
            toast({
              title: "Erro",
              description: `Não foi possível enviar a mensagem: ${error.message || 'Erro desconhecido'}`,
              variant: "destructive",
            });
            return false;
          }
        }
      );
      return true;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente mais tarde.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleClearConversation = () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para limpar conversas",
        variant: "destructive",
      });
      return false;
    }
    
    clearConversation.mutate(recipientId, {
      onSuccess: () => {
        setCurrentPage(1);
        refetch();
        toast({
          title: "Conversa limpa",
          description: "Todas as mensagens foram removidas."
        });
        return true;
      },
      onError: (error: any) => {
        toast({
          title: "Erro",
          description: `Não foi possível limpar a conversa: ${error.message || 'Erro desconhecido'}`,
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para excluir mensagens",
        variant: "destructive",
      });
      return;
    }
    
    deleteMessage.mutate(messageId, {
      onSuccess: () => {
        refetch();
        toast({
          title: "Mensagem excluída",
          description: "A mensagem foi excluída com sucesso."
        });
      },
      onError: (error: any) => {
        toast({
          title: "Erro",
          description: `Não foi possível excluir a mensagem: ${error.message || 'Erro desconhecido'}`,
          variant: "destructive",
        });
      }
    });
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para editar mensagens",
        variant: "destructive",
      });
      return;
    }
    
    editMessage.mutate(
      { messageId, content: newContent },
      {
        onSuccess: () => {
          refetch();
          toast({
            title: "Mensagem editada",
            description: "A mensagem foi editada com sucesso."
          });
        },
        onError: (error: any) => {
          toast({
            title: "Erro",
            description: `Não foi possível editar a mensagem: ${error.message || 'Erro desconhecido'}`,
            variant: "destructive",
          });
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
    if (user) {
      sendTypingStatus(recipientId, isTyping);
    }
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
