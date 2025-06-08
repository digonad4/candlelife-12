
import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { AdvancedMessageItem } from "./AdvancedMessageItem";
import { Message } from "@/types/social";
import { useAuth } from "@/context/AuthContext";

interface AdvancedChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  hasMore: boolean;
  totalCount: number;
  searchQuery: string;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onLoadMore: () => void;
}

export const AdvancedChatMessages = ({
  messages,
  isLoading,
  isLoadingMore,
  isError,
  hasMore,
  totalCount,
  searchQuery,
  onDeleteMessage,
  onEditMessage,
  onLoadMore
}: AdvancedChatMessagesProps) => {
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !searchQuery) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, searchQuery]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Erro ao carregar mensagens</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
      <div className="space-y-4 py-4">
        {hasMore && (
          <div className="text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Carregar mensagens anteriores
            </Button>
          </div>
        )}

        {searchQuery && (
          <div className="text-center text-sm text-muted-foreground">
            {totalCount} mensagem(ns) encontrada(s) para "{searchQuery}"
          </div>
        )}

        {messages.map((message) => (
          <AdvancedMessageItem
            key={message.id}
            message={message}
            isOwnMessage={message.sender_id === user?.id}
            onDelete={() => onDeleteMessage(message.id)}
            onEdit={(newContent) => onEditMessage(message.id, newContent)}
          />
        ))}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
