
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, Smile } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: Date;
};

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mocked data for demonstration
  useEffect(() => {
    if (isOpen) {
      // This would typically be a fetch from your backend
      const mockMessages: Message[] = [
        {
          id: "1",
          senderId: user?.id || "",
          senderName: user?.user_metadata?.username || "You",
          text: "Olá! Como vai?",
          timestamp: new Date(Date.now() - 60000 * 15),
        },
        {
          id: "2",
          senderId: recipientId,
          senderName: recipientName,
          senderAvatar: recipientAvatar,
          text: "Estou bem, e você?",
          timestamp: new Date(Date.now() - 60000 * 10),
        },
        {
          id: "3",
          senderId: user?.id || "",
          senderName: user?.user_metadata?.username || "You",
          text: "Tudo ótimo! Só queria confirmar sobre o pagamento daquela transação.",
          timestamp: new Date(Date.now() - 60000 * 5),
        },
      ];
      setMessages(mockMessages);
    }
  }, [isOpen, recipientId, recipientName, recipientAvatar, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.user_metadata?.username || "You",
      text: newMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {recipientAvatar ? (
                <AvatarImage src={recipientAvatar} alt={recipientName} />
              ) : (
                <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <span>{recipientName}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.senderId === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p>{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
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
              />
              <div className="flex flex-col gap-2">
                <Button size="icon" variant="ghost" type="button">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button size="icon" type="button" onClick={handleSendMessage}>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
