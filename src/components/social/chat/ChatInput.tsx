import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, X } from "lucide-react";
import { AttachmentUpload } from './AttachmentUpload';

interface ChatInputProps {
  onSendMessage: (message: string, file?: File | null) => Promise<void>;
  onTypingStatusChange: (isTyping: boolean) => void;
  isSubmitting: boolean;
  className?: string;
}

export const ChatInput = ({
  onSendMessage,
  onTypingStatusChange,
  isSubmitting,
  className = ""
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const typingTimeout = useRef<NodeJS.Timeout>();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Typing indicator logic
    if (value.trim()) {
      onTypingStatusChange(true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        onTypingStatusChange(false);
      }, 3000);
    } else {
      onTypingStatusChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !attachedFile) || isSubmitting) return;

    try {
      if (attachedFile) {
        setIsUploading(true);
        // Handle file upload here
        console.log('Uploading file:', attachedFile);
      }
      
      await onSendMessage(message.trim(), attachedFile);
      setMessage("");
      setAttachedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setAttachedFile(file);
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  return (
    <div className={`border-t bg-background p-4 ${className}`}>
      {attachedFile && (
        <div className="mb-2 p-2 bg-muted rounded flex items-center justify-between">
          <span className="text-sm truncate">{attachedFile.name}</span>
          <Button variant="ghost" size="sm" onClick={removeAttachment}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 flex items-center gap-2">
          <AttachmentUpload 
            onFileSelect={handleFileSelect}
            isUploading={isUploading}
          />
          
          <Input
            value={message}
            onChange={handleInputChange}
            placeholder="Digite sua mensagem..."
            disabled={isSubmitting || isUploading}
            className="flex-1"
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={(!message.trim() && !attachedFile) || isSubmitting || isUploading}
          size="icon"
        >
          {isSubmitting || isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};
