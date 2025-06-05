
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface SimpleChatModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

export const SimpleChatModal = ({
  isOpen,
  onOpenChange,
  recipientId,
  recipientName,
  recipientAvatar,
}: SimpleChatModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const { 
    getConversation, 
    sendMessage, 
    clearConversation 
  } = useMessages();

  const { 
    data: conversationData = { messages: [], totalCount: 0, hasMore: false },
    isLoading: conversationLoading,
    refetch: refetchConversation
  } = getConversation(recipientId, 1, 50, "");

  const messages = conversationData.messages || [];

  useEffect(() => {
    if (isOpen) {
      refetchConversation();
    }
  }, [isOpen, refetchConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const messageContent = message.trim();
    setMessage("");

    try {
      await new Promise<void>((resolve, reject) => {
        sendMessage.mutate(
          { recipientId, content: messageContent },
          {
            onSuccess: () => {
              refetchConversation();
              resolve();
            },
            onError: (error: any) => {
              toast({
                title: "Erro",
                description: "Não foi possível enviar a mensagem",
                variant: "destructive",
              });
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleClearConversation = () => {
    if (!user) return;
    
    clearConversation.mutate(recipientId, {
      onSuccess: () => {
        refetchConversation();
        toast({
          title: "Conversa limpa",
          description: "Todas as mensagens foram removidas."
        });
      },
      onError: () => {
        toast({
          title: "Erro",
          description: "Não foi possível limpar a conversa",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md h-[80vh] max-h-[600px] p-0 gap-0 flex flex-col">
        <DialogHeader className="border-b p-4 shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {recipientAvatar ? (
                  <AvatarImage src={recipientAvatar} alt={recipientName} />
                ) : (
                  <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <span className="font-medium truncate">{recipientName}</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleClearConversation}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar conversa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          {conversationLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-16 w-full max-w-xs rounded-lg" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="text-muted-foreground">
                <p className="text-sm">Nenhuma mensagem ainda.</p>
                <p className="text-xs mt-1">Seja o primeiro a enviar uma mensagem!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwnMessage && (
                      <Avatar className="h-6 w-6 mt-1">
                        {recipientAvatar ? (
                          <AvatarImage src={recipientAvatar} alt={recipientName} />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {recipientName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || sendMessage.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
