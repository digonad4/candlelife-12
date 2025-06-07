
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Image, File, Smile } from "lucide-react";
import { useTypingIndicator } from "@/hooks/messages/useTypingIndicator";

interface EnhancedChatInputProps {
  onSendMessage: (message: string, file?: File) => Promise<void>;
  isSubmitting: boolean;
  recipientId: string;
}

export const EnhancedChatInput = ({
  onSendMessage,
  isSubmitting,
  recipientId
}: EnhancedChatInputProps) => {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { sendTypingStatus } = useTypingIndicator();

  // Handle typing indicator
  useEffect(() => {
    if (message.trim().length > 0) {
      sendTypingStatus(recipientId, true);
    } else {
      sendTypingStatus(recipientId, false);
    }

    // Cleanup typing when component unmounts
    return () => {
      sendTypingStatus(recipientId, false);
    };
  }, [message, recipientId, sendTypingStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !attachment) || isSubmitting) {
      return;
    }

    try {
      await onSendMessage(message, attachment || undefined);
      setMessage("");
      setAttachment(null);
      setAttachmentPreview(null);
      
      // Focus back to textarea
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachmentPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t p-4 space-y-3 bg-background/50 backdrop-blur-sm">
      {attachment && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          {attachmentPreview ? (
            <img 
              src={attachmentPreview} 
              alt="Preview" 
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-16 bg-background rounded flex items-center justify-center">
              <File className="h-6 w-6" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.name}</p>
            <p className="text-xs text-muted-foreground">
              {(attachment.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={removeAttachment}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="min-h-[44px] max-h-[120px] resize-none pr-12"
            disabled={isSubmitting}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            title="Emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-col gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 p-0"
            title="Anexar arquivo"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button
            type="submit"
            size="sm"
            disabled={(!message.trim() && !attachment) || isSubmitting}
            className="h-11 w-11 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
      
      <p className="text-xs text-muted-foreground text-center">
        Pressione Enter para enviar, Shift+Enter para quebra de linha
      </p>
    </div>
  );
};
