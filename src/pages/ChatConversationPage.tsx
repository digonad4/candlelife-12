
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, MoreVertical, Wifi, WifiOff } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useSimpleChat } from "@/hooks/useSimpleChat";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNative } from "@/hooks/useNative";
import { useMobileNative } from "@/hooks/useMobileNative";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ChatConversationPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { hapticFeedback, isNative } = useNative();
  const { safeAreaInsets, applySafeAreaPadding, isKeyboardOpen, keyboardHeight } = useMobileNative();
  
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    getConversationMessages,
    sendMessage: sendMessageMutation,
    markAsRead
  } = useSimpleChat();

  const conversationQuery = getConversationMessages(userId || "");
  const messages = conversationQuery.data || [];
  
  const recipientName = location.state?.username || "Usuário";
  const recipientAvatar = location.state?.avatar_url;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (userId) {
      setTimeout(() => {
        markAsRead.mutate(userId);
      }, 1000);
    }
  }, [userId, markAsRead]);

  const handleSendMessage = async () => {
    if (!message.trim() || !userId) return;

    console.log('Tentando enviar mensagem:', { message: message.trim(), userId, user: user?.id });

    try {
      console.log('Enviando mensagem...');
      await sendMessageMutation.mutateAsync({
        recipientId: userId,
        content: message.trim()
      });
      console.log('Mensagem enviada com sucesso!');
      
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const isMyMessage = (senderId: string) => senderId === user?.id;

  const groupMessagesByDate = () => {
    const groups: { [key: string]: typeof messages } = {};
    
    messages.forEach(msg => {
      const dateKey = new Date(msg.created_at).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  };

  if (!userId) {
    navigate('/chat');
    return null;
  }

  if (conversationQuery.isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center p-6">
        <Spinner className="w-8 h-8 mb-4" />
        <p className="text-muted-foreground">Carregando conversa...</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate();

  // Calculate dynamic heights for native layout
  const headerHeight = isNative ? safeAreaInsets.top + 56 : 56; // 56px is the header content height
  const inputAreaHeight = isNative && isKeyboardOpen ? keyboardHeight + 80 : 80; // 80px is the input area height
  const availableHeight = isNative 
    ? `calc(100vh - ${headerHeight}px - ${inputAreaHeight}px)`
    : `calc(100vh - ${headerHeight}px - 80px)`;

  return (
    <div 
      className="flex flex-col h-screen w-full max-w-full mx-auto bg-background"
      style={isNative ? applySafeAreaPadding('all') : {}}
    >
      {/* Fixed Header */}
      <div 
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex-shrink-0"
        style={isNative ? { paddingTop: `calc(0.75rem + ${safeAreaInsets.top}px)` } : {}}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigate('/chat');
              hapticFeedback('light');
            }}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10">
              {recipientAvatar ? (
                <AvatarImage src={recipientAvatar} alt={recipientName} />
              ) : (
                <AvatarFallback>
                  {recipientName?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background bg-green-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-lg truncate">
              {recipientName}
            </h2>
            <div className="flex items-center gap-2">
              <Wifi className="h-3 w-3 text-green-500" />
              <p className="text-xs text-green-500">Online</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver perfil</DropdownMenuItem>
              <DropdownMenuItem>Limpar conversa</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Bloquear usuário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area with Scroll */}
      <ScrollArea 
        className="flex-1 px-4 min-h-0" 
        ref={scrollAreaRef}
        style={{ height: availableHeight }}
      >
        <div className="space-y-4 py-4">
          {groupedMessages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!
              </p>
            </div>
          ) : (
            groupedMessages.map(([dateKey, dateMessages]) => (
              <div key={dateKey}>
                <div className="flex justify-center my-4">
                  <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {formatMessageDate(dateKey)}
                  </span>
                </div>
                
                {dateMessages.map((msg, index) => {
                  const isMe = isMyMessage(msg.sender_id);
                  const nextMsg = dateMessages[index + 1];
                  const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
                  const isPending = (msg as any).message_status === 'sending';
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${
                        isLastInGroup ? 'mb-4' : 'mb-1'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2 break-words relative ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        } ${isPending ? 'opacity-70' : ''}`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <p className={`text-xs ${
                            isMe 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            {formatMessageTime(msg.created_at)}
                          </p>
                          {isMe && (
                            <span className={`text-xs ${
                              isPending
                                ? 'text-primary-foreground/50'
                                : msg.read 
                                ? 'text-blue-500' 
                                : 'text-primary-foreground/70'
                            }`}>
                              {isPending ? '⏳' : msg.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                        {isPending && (
                          <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                            Enviando...
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Fixed Input Area */}
      <div 
        className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border/50 p-4 flex-shrink-0"
        style={isNative ? { 
          paddingBottom: `calc(1rem + ${safeAreaInsets.bottom}px)`,
          marginBottom: isKeyboardOpen ? `${keyboardHeight}px` : '0px'
        } : {}}
      >
        <div className="flex items-center gap-3 w-full">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-full min-w-0"
            disabled={sendMessageMutation.isPending}
          />
          
          <Button
            size="icon"
            onClick={() => {
              handleSendMessage();
              hapticFeedback('light');
            }}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="rounded-full flex-shrink-0"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatConversationPage;
