
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import our refactored components with corrected paths
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatMessageInput } from "./ChatMessageInput";

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
  const { getConversation, sendMessage, clearConversation, deleteMessage, editMessage } = useMessages();
  
  const { data: messages = [], isLoading, isError, refetch } = getConversation(recipientId);

  // Initialize chat and refetch messages when opened
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    sendMessage.mutate(
      { recipientId, content: newMessage },
      {
        onSuccess: () => {
          setNewMessage("");
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
      },
      onError: (error) => {
        toast({
          title: "Erro",
          description: `Não foi possível excluir a mensagem: ${error.message}`,
          variant: "destructive",
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-xl p-0 gap-0 h-[80vh] max-h-[600px] flex flex-col">
          <ChatHeader 
            recipientName={recipientName}
            recipientAvatar={recipientAvatar}
            onSearchClick={() => {}}
            onClearChat={() => setIsDeleteDialogOpen(true)}
          />

          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            isError={isError}
            currentUserId={user?.id}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={handleEditMessage}
          />
          
          <ChatMessageInput
            message={newMessage}
            onMessageChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            onSendMessage={handleSendMessage}
            isSubmitting={sendMessage.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar toda esta conversa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearConversation}
              disabled={clearConversation.isPending}
            >
              {clearConversation.isPending ? "Limpando..." : "Limpar conversa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
