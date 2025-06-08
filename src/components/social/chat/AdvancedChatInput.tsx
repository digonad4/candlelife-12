
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, X } from "lucide-react";

interface AdvancedChatInputProps {
  onSendMessage: (content: string, attachment?: File) => Promise<void>;
  onTypingStatusChange: (isTyping: boolean) => void;
  isSubmitting: boolean;
}

export const AdvancedChatInput = ({
  onSendMessage,
  onTypingStatusChange,
  isSubmitting
}: AdvancedChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTyping = (value: string) => {
    setMessage(value);
    
    // Notificar que está digitando
    onTypingStatusChange(true);
    
    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Definir timeout para parar de digitar
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStatusChange(false);
    }, 1000);
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;
    
    try {
      await onSendMessage(message.trim(), selectedFile || undefined);
      setMessage("");
      setSelectedFile(null);
      onTypingStatusChange(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t p-4 space-y-2">
      {selectedFile && (
        <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
          <Paperclip className="h-4 w-4" />
          <span className="flex-1 truncate">{selectedFile.name}</span>
          <Button size="sm" variant="ghost" onClick={removeFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          disabled={isSubmitting}
          className="flex-1"
        />
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,document/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          size="icon"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <Button
          size="icon"
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || isSubmitting}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
