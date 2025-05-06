
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, SendHorizonal, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (content: string, attachment: File | null) => boolean;
  onTypingStatusChange: (isTyping: boolean) => void;
  isSubmitting: boolean;
}

export const ChatInput = ({
  onSendMessage,
  onTypingStatusChange,
  isSubmitting
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear typing status when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTypingStatusChange(false);
    };
  }, [onTypingStatusChange]);
  
  // Handle typing status changes with debounce
  useEffect(() => {
    if (message.length > 0 && !isTyping) {
      setIsTyping(true);
      onTypingStatusChange(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (message.length === 0 || isTyping) {
        setIsTyping(false);
        onTypingStatusChange(false);
      }
    }, 1000);
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTypingStatusChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() || attachment) {
      const success = onSendMessage(message, attachment);
      if (success) {
        setMessage("");
        setAttachment(null);
        onTypingStatusChange(false);
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAttachment(file);
  };
  
  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      {attachment && (
        <div className="mb-2 p-2 bg-muted rounded-md flex items-center justify-between">
          <span className="text-sm truncate">{attachment.name}</span>
          <Button 
            type="button" 
            variant="ghost"
            size="icon"
            onClick={clearAttachment}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,application/pdf"
          />
        </Button>
        
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="min-h-10 resize-none"
          rows={1}
          disabled={isSubmitting}
        />
        
        <Button 
          type="submit" 
          size="icon" 
          className="h-10 w-10"
          disabled={isSubmitting || (!message.trim() && !attachment)}
        >
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};
