
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Trash2, MoreVertical } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useMessages, Message } from "@/hooks/useMessages";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
  const [newMessage, setNewMessage] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getConversation, sendMessage, clearConversation, deleteMessage } = useMessages();
  
  const { data: conversationData = { messages: [], totalCount: 0, hasMore: false }, isLoading, refetch } = getConversation(recipientId);

  // Extract messages from the conversationData
  const messages = conversationData.messages || [];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    sendMessage.mutate(
      { recipientId, content: newMessage },
      {
        onSuccess: () => {
          setNewMessage("");
          refetch();
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
      }
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage.mutate(messageId, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {recipientAvatar ? (
                    <AvatarImage src={recipientAvatar} alt={recipientName} />
                  ) : (
                    <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <span>{recipientName}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar conversa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="text-center py-4">Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma mensagem para exibir. Envie uma mensagem para iniciar a conversa.
                </div>
              ) : (
                messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div className="group relative">
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender_id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </p>
                      </div>
                      
                      {message.sender_id === user?.id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 h-6 w-6 bg-background/80"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-2 border-t">
              <div className="flex items-end gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[60px] resize-none"
                  disabled={sendMessage.isPending}
                />
                <Button 
                  size="icon" 
                  type="button" 
                  onClick={handleSendMessage}
                  disabled={sendMessage.isPending || !newMessage.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
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
