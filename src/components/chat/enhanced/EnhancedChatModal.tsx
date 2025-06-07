
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEnhancedMessages } from "@/hooks/useEnhancedMessages";
import { useAuth } from "@/context/AuthContext";
import { EnhancedChatHeader } from "./EnhancedChatHeader";
import { EnhancedChatMessages } from "./EnhancedChatMessages";
import { EnhancedChatInput } from "./EnhancedChatInput";
import { ConversationSettingsDialog } from "./ConversationSettingsDialog";
import { useToast } from "@/hooks/use-toast";

interface EnhancedChatModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

export const EnhancedChatModal = ({
  isOpen,
  onOpenChange,
  recipientId,
  recipientName,
  recipientAvatar,
}: EnhancedChatModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    setActiveConversation,
    useConversation,
    useSendMessage,
    useToggleReaction,
    useMarkConversationAsRead,
    useClearConversation,
    useConversationSettings,
    isConnected
  } = useEnhancedMessages();

  const conversationQuery = useConversation(recipientId, searchTerm);
  const sendMessage = useSendMessage();
  const toggleReaction = useToggleReaction();
  const markAsRead = useMarkConversationAsRead();
  const clearConversation = useClearConversation();
  const settingsQuery = useConversationSettings(recipientId);

  const messages = conversationQuery.data || [];

  // Set active conversation when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveConversation(recipientId);
      
      // Mark conversation as read after a short delay
      setTimeout(() => {
        markAsRead.mutate(recipientId);
      }, 1000);
    } else {
      setActiveConversation(null);
    }
  }, [isOpen, recipientId, setActiveConversation, markAsRead]);

  const handleSendMessage = async (content: string, attachment?: File) => {
    try {
      await sendMessage.mutateAsync({
        recipientId,
        content,
        messageType: attachment ? 'file' : 'text',
        attachmentUrl: attachment ? URL.createObjectURL(attachment) : undefined,
        fileName: attachment?.name,
        fileSize: attachment?.size
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    }
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    try {
      await toggleReaction.mutateAsync({ messageId, reaction });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar reação",
        variant: "destructive"
      });
    }
  };

  const handleClearConversation = async () => {
    try {
      await clearConversation.mutateAsync(recipientId);
      toast({
        title: "Conversa limpa",
        description: "Todas as mensagens foram removidas"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar a conversa",
        variant: "destructive"
      });
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-4xl p-0 gap-0 h-[85vh] max-h-[700px] flex flex-col">
          <EnhancedChatHeader
            recipientName={recipientName}
            recipientAvatar={recipientAvatar}
            isOnline={isConnected}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onClearChat={handleClearConversation}
            onSearch={handleSearch}
            settings={settingsQuery.data}
          />

          <EnhancedChatMessages
            messages={messages}
            currentUserId={user?.id}
            isLoading={conversationQuery.isLoading}
            onReaction={handleReaction}
            searchTerm={searchTerm}
          />

          <EnhancedChatInput
            onSendMessage={handleSendMessage}
            isSubmitting={sendMessage.isPending}
            recipientId={recipientId}
          />
        </DialogContent>
      </Dialog>

      <ConversationSettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        recipientId={recipientId}
        recipientName={recipientName}
        currentSettings={settingsQuery.data}
      />
    </>
  );
};
