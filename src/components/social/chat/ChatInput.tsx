
import { useState, useRef } from "react";
import { ChatMessageInput } from "./ChatMessageInput";

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
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  
  const handleSend = () => {
    const success = onSendMessage(newMessage, attachment);
    if (success) {
      setNewMessage("");
      setAttachment(null);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleAttachmentChange = (file: File | null) => {
    setAttachment(file);
  };
  
  return (
    <ChatMessageInput
      message={newMessage}
      onMessageChange={(e) => setNewMessage(e.target.value)}
      onKeyDown={handleKeyPress}
      onSendMessage={handleSend}
      isSubmitting={isSubmitting}
      onTypingStatusChange={onTypingStatusChange}
      onAttachmentChange={handleAttachmentChange}
      attachment={attachment}
    />
  );
};
