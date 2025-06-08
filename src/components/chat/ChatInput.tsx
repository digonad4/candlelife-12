
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X } from "lucide-react";
import { AttachmentUpload } from "@/components/social/chat/AttachmentUpload";

interface ChatInputProps {
  onSendMessage: (message: string, file?: File | null) => Promise<void>;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle typing status
  const handleTypingChange = (typing: boolean) => {
    if (typing !== isTyping) {
      setIsTyping(typing);
      onTypingStatusChange(typing);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing status after 3 seconds of inactivity
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingStatusChange(false);
      }, 3000);
    }
  };

  const handleInputChange = (value: string) => {
    setMessage(value);
    handleTypingChange(value.trim().length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !attachment) || isSubmitting) {
      return;
    }

    try {
      await onSendMessage(message, attachment);
      setMessage("");
      setAttachment(null);
      handleTypingChange(false);
      
      // Focus back to textarea after sending
      textareaRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t p-4 space-y-3">
      {attachment && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Paperclip className="h-4 w-4" />
          <span className="text-sm truncate flex-1">{attachment.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeAttachment}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="min-h-[40px] max-h-[120px] resize-none"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <AttachmentUpload onFileSelect={setAttachment} />
          
          <Button
            type="submit"
            size="sm"
            disabled={(!message.trim() && !attachment) || isSubmitting}
            className="h-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
