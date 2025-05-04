
import React, { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Message } from "@/hooks/messages/types";
import { ChatPagination } from "./ChatPagination";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageGroup } from "./MessageGroup";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  currentUserId?: string;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  totalCount: number;
}

export const ChatMessages = ({
  messages,
  isLoading,
  isLoadingMore,
  isError,
  currentUserId,
  onDeleteMessage,
  onEditMessage,
  onLoadMore,
  hasMore,
  totalCount
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = React.useState(true);

  useEffect(() => {
    // Apenas rola automaticamente se não estamos carregando mais mensagens (paginação)
    if (shouldScrollToBottom && !isLoadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldScrollToBottom(false);
    }
  }, [messages, isLoadingMore, shouldScrollToBottom]);

  // Reseta a flag de rolagem quando novas mensagens entram que não são da paginação
  useEffect(() => {
    if (!isLoadingMore) {
      setShouldScrollToBottom(true);
    }
  }, [messages.length, isLoadingMore]);

  const renderLoadingSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <div 
        key={`skeleton-${index}`} 
        className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} mb-4`}
      >
        {index % 2 === 0 && (
          <Skeleton className="h-8 w-8 rounded-full mr-2" />
        )}
        <div className="space-y-2">
          <Skeleton className={`h-16 ${index % 2 === 0 ? 'w-48' : 'w-56'} rounded-lg`} />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ));
  };

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
      {isLoading && !isLoadingMore ? (
        <div className="space-y-4">
          {renderLoadingSkeletons()}
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-destructive">
          Não foi possível carregar as mensagens.
        </div>
      ) : messages && messages.length > 0 ? (
        <>
          <ChatPagination
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={onLoadMore}
            totalCount={totalCount}
            visibleCount={messages.length}
          />
          
          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          
          <MessageGroup
            messages={messages}
            currentUserId={currentUserId}
            onDeleteMessage={onDeleteMessage}
            onEditMessage={onEditMessage}
          />

          <div ref={messagesEndRef} />
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma mensagem ainda. Diga olá!
        </div>
      )}
    </ScrollArea>
  );
};
