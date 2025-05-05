
import React, { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Paperclip, X, Image } from "lucide-react";

interface ChatMessageInputProps {
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  onAttachmentChange: (file: File | null) => void;
  attachment: File | null;
  isSubmitting: boolean;
  onTypingStatusChange?: (isTyping: boolean) => void;
}

export const ChatMessageInput = ({
  message,
  onMessageChange,
  onKeyDown,
  onSendMessage,
  onAttachmentChange,
  attachment,
  isSubmitting,
  onTypingStatusChange
}: ChatMessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);
  
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMessageChange(e);
    
    // Handle typing indicator
    if (onTypingStatusChange) {
      onTypingStatusChange(true);
      
      // Clear previous timeout
      if (typingTimeout) {
        window.clearTimeout(typingTimeout);
      }
      
      // Set new timeout to turn off typing indicator after 2 seconds of inactivity
      const timeoutId = window.setTimeout(() => {
        onTypingStatusChange(false);
      }, 2000);
      
      setTypingTimeout(Number(timeoutId));
    }
  };
  
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onAttachmentChange(file);
    
    // Reset the input so the same file can be selected again
    if (e.target.value) {
      e.target.value = '';
    }
  };
  
  const clearAttachment = () => {
    onAttachmentChange(null);
  };
  
  return (
    <div className="p-4 border-t mt-auto">
      {attachment && (
        <div className="mb-2 p-2 border rounded-md flex items-center justify-between bg-accent/30">
          <div className="flex items-center gap-2 truncate">
            {attachment.type.startsWith('image/') ? (
              <Image className="h-4 w-4" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
            <span className="text-sm truncate">{attachment.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={clearAttachment}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={handleAttachmentClick}
          className="flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
        </Button>

        <Textarea
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={handleTyping}
          onKeyDown={onKeyDown}
          className="min-h-[60px] resize-none"
        />
        
        <Button 
          onClick={onSendMessage} 
          disabled={isSubmitting || (!message.trim() && !attachment)}
          size="icon"
          className="flex-shrink-0"
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
