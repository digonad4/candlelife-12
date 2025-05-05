
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { useToast } from "@/hooks/use-toast";

// Import our components
import { ChatHeader } from "@/components/social/chat/ChatHeader";
import { ChatMessages } from "@/components/social/chat/ChatMessages";
import { ChatMessageInput } from "@/components/social/chat/ChatMessageInput";
import { DeleteConversationDialog } from "@/components/social/chat/DeleteConversationDialog";
import { TypingIndicator } from "@/components/social/chat/TypingIndicator";
import { useTypingIndicator } from "@/hooks/messages/useTypingIndicator";

interface ChatModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

export const ChatModal = ({
  isOpen,
  onOpenChange,
  recipientId,
  recipientName,
  recipientAvatar,
}: ChatModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
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
  
  // Extrair as mensagens dos dados da conversa
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

  const handleSendMessage = () => {
    if ((!newMessage.trim() && !attachment) || !user) return;

    sendMessage.mutate(
      { recipientId, content: newMessage.trim() || " ", attachment },
      {
        onSuccess: () => {
          setNewMessage("");
          setAttachment(null);
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = () => {
    clearConversation.mutate(recipientId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setCurrentPage(1);
        refetch();
        toast({
          title: "Conversa limpa",
          description: "Todas as mensagens foram removidas."
        });
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
  
  const handleAttachmentChange = (file: File | null) => {
    setAttachment(file);
    
    if (file) {
      // Show a toast with the selected file
      toast({
        title: "Arquivo anexado",
        description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-xl p-0 gap-0 h-[80vh] max-h-[600px] flex flex-col">
          <ChatHeader 
            recipientName={recipientName}
            recipientAvatar={recipientAvatar}
            onSearchClick={() => {}}
            onClearChat={() => setIsDeleteDialogOpen(true)}
            onSearch={handleSearch}
            isSearching={isSearching}
          />

          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            isLoadingMore={isFetchingMore}
            isError={isError}
            currentUserId={user?.id}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={handleEditMessage}
            onLoadMore={handleLoadMoreMessages}
            hasMore={hasMore}
            totalCount={totalCount}
            searchQuery={searchQuery}
          />
          
          {recipientIsTyping && (
            <TypingIndicator 
              isTyping={recipientIsTyping} 
              username={recipientName} 
            />
          )}
          
          <ChatMessageInput
            message={newMessage}
            onMessageChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            onSendMessage={handleSendMessage}
            isSubmitting={sendMessage.isPending}
            onTypingStatusChange={handleTypingStatusChange}
            onAttachmentChange={handleAttachmentChange}
            attachment={attachment}
          />
        </DialogContent>
      </Dialog>

      <DeleteConversationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleClearConversation}
        isPending={clearConversation.isPending}
      />
    </>
  );
};
