
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type ChatModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
};

export function ChatModal({
  isOpen,
  onOpenChange,
  recipientId,
  recipientName,
  recipientAvatar,
}: ChatModalProps) {
  const { user } = useAuth();
  const { sendMessage } = useMessages();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Buscar mensagens da conversa
  const { 
    data: conversation, 
    isLoading, 
    isError, 
    refetch 
  } = useMessages().getConversation(recipientId);
  
  // Sempre rolar para a mensagem mais recente
  useEffect(() => {
    if (isOpen && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, conversation]);
  
  // Refetch messages when modal opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);
  
  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      await sendMessage.mutateAsync({
        recipientId,
        content: message.trim()
      });
      setMessage("");
      
      // Aguardar um momento e fazer scroll para a mensagem mais recente
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[500px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              {recipientAvatar ? (
                <AvatarImage src={recipientAvatar} />
              ) : (
                <AvatarFallback>
                  {recipientName && recipientName.length > 0 
                    ? recipientName[0].toUpperCase() 
                    : <UserIcon className="h-4 w-4" />}
                </AvatarFallback>
              )}
            </Avatar>
            <DialogTitle>{recipientName}</DialogTitle>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive">
              Não foi possível carregar as mensagens.
            </div>
          ) : conversation && conversation.length > 0 ? (
            <>
              {conversation.map((msg) => {
                const isSentByMe = msg.sender_id === user?.id;
                
                return (
                  <div 
                    key={msg.id} 
                    className={`mb-4 flex ${isSentByMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex items-start gap-2 max-w-[80%]">
                      {!isSentByMe && (
                        <Avatar className="h-8 w-8">
                          {msg.sender_profile?.avatar_url ? (
                            <AvatarImage src={msg.sender_profile.avatar_url} />
                          ) : (
                            <AvatarFallback>
                              {msg.sender_profile?.username && msg.sender_profile.username.length > 0
                                ? msg.sender_profile.username[0].toUpperCase()
                                : <UserIcon className="h-4 w-4" />}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      
                      <div>
                        <div 
                          className={`p-3 rounded-lg ${
                            isSentByMe 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatMessageTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messageEndRef} />
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma mensagem ainda. Diga olá!
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t mt-auto">
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isSubmitting || !message.trim()}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
