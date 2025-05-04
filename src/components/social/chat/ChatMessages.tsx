
import React, { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { MessageItem } from "./MessageItem";
import { Message } from "@/hooks/messages/types";
import { ChatPagination } from "./ChatPagination";
import { Skeleton } from "@/components/ui/skeleton";

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
    // Only auto-scroll if we're not loading more (pagination)
    if (shouldScrollToBottom && !isLoadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldScrollToBottom(false);
    }
  }, [messages, isLoadingMore, shouldScrollToBottom]);

  // Reset scroll flag when new messages come in that aren't from pagination
  useEffect(() => {
    if (!isLoadingMore) {
      setShouldScrollToBottom(true);
    }
  }, [messages.length, isLoadingMore]);

  // Função para agrupar mensagens consecutivas do mesmo remetente
  const groupMessages = (messages: Message[]): {
    message: Message;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
  }[] => {
    return messages.map((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
      
      const isFirstInGroup = !prevMessage || prevMessage.sender_id !== message.sender_id;
      const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id;
      
      return {
        message,
        isFirstInGroup,
        isLastInGroup
      };
    });
  };

  const groupedMessages = groupMessages(messages);

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
          
          {groupedMessages.map(({ message, isFirstInGroup, isLastInGroup }) => (
            <MessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              onDeleteMessage={onDeleteMessage}
              onEditMessage={onEditMessage}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
            />
          ))}
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
