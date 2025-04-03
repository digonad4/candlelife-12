
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
}

export const ChatMessages = ({
  messages,
  isLoading,
  isError,
  currentUserId,
  onDeleteMessage
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              currentUserId={currentUserId}
              onDeleteMessage={onDeleteMessage}
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
