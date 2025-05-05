
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessageInputProps {
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
  isSubmitting: boolean;
  onTypingStatusChange?: (isTyping: boolean) => void;
  onAttachmentChange?: (file: File | null) => void;
  attachment?: File | null;
}

export const ChatMessageInput = ({
  message,
  onMessageChange,
  onKeyDown,
  onSendMessage,
  isSubmitting,
  onTypingStatusChange,
  onAttachmentChange,
  attachment
}: ChatMessageInputProps) => {
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle typing indicator logic
  useEffect(() => {
    if (!onTypingStatusChange) return;
    
    // Only trigger typing status when there's text
    if (message.trim().length > 0) {
      onTypingStatusChange(true);
      
      // Clear existing timer if any
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      
      // Set new timer to stop typing indicator after 2 seconds of inactivity
      const timer = setTimeout(() => {
        onTypingStatusChange(false);
      }, 2000);
      
      setTypingTimer(timer);
    } else if (typingTimer) {
      clearTimeout(typingTimer);
      onTypingStatusChange(false);
    }
    
    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [message, onTypingStatusChange, typingTimer]);
  
  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (onAttachmentChange && file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Arquivo muito grande. O tamanho máximo é 10MB.");
        // Reset the input
        e.target.value = "";
        return;
      }
      
      onAttachmentChange(file);
    }
  };
  
  const handleRemoveAttachment = () => {
    if (onAttachmentChange) {
      onAttachmentChange(null);
    }
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <div className="p-2 border-t">
      {attachment && (
        <div className="mb-2 p-2 border rounded-md bg-muted/50 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Paperclip className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm truncate">{attachment.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(attachment.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleRemoveAttachment}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Paperclip className="h-5 w-5" />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
        </Button>
        
        <Textarea
          value={message}
          onChange={onMessageChange}
          onKeyDown={onKeyDown}
          placeholder="Digite sua mensagem..."
          className="min-h-[60px] resize-none"
          disabled={isSubmitting}
        />
        
        <Button 
          size="icon" 
          type="button" 
          onClick={onSendMessage}
          disabled={isSubmitting || (!message.trim() && !attachment)}
          className="flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
