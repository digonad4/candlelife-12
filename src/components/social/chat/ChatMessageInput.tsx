
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface ChatMessageInputProps {
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
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
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={onMessageChange}
          onKeyDown={onKeyDown}
          className="min-h-[60px] resize-none"
        />
        <Button 
          onClick={onSendMessage} 
          disabled={isSubmitting || !message.trim()}
          size="icon"
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
