
import React, { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { MessageItem } from "./MessageItem";
import { Message } from "@/hooks/messages/types";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isError: boolean;
  currentUserId?: string;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
}

export const ChatMessages = ({
  messages,
  isLoading,
  isError,
  currentUserId,
  onDeleteMessage,
  onEditMessage
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <ScrollArea className="flex-1 p-4">
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-destructive">
          Não foi possível carregar as mensagens.
        </div>
      ) : messages && messages.length > 0 ? (
        <>
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
