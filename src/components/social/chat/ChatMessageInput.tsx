
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface ChatMessageInputProps {
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  isSubmitting: boolean;
}

export const ChatMessageInput = ({
  message,
  onMessageChange,
  onKeyDown,
  onSendMessage,
  isSubmitting
}: ChatMessageInputProps) => {
  return (
    <div className="p-4 border-t mt-auto">
      <div className="flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={onMessageChange}
          onKeyDown={onKeyDown}
          className="flex-1"
        />
        <Button 
          onClick={onSendMessage} 
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
  );
};
