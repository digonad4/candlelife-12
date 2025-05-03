
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserIcon, X } from "lucide-react";
import { Message } from "@/hooks/messages/types";

interface MessageItemProps {
  message: Message;
  currentUserId?: string;
  onDeleteMessage: (messageId: string) => void;
}

export const MessageItem = ({ message, currentUserId, onDeleteMessage }: MessageItemProps) => {
  const isSentByMe = message.sender_id === currentUserId;
  
  const formatMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  };
  
  return (
    <div className={`mb-4 flex ${isSentByMe ? "justify-end" : "justify-start"}`}>
      <div className="flex items-start gap-2 max-w-[80%]">
        {!isSentByMe && (
          <Avatar className="h-8 w-8 shrink-0">
            {message.sender_profile?.avatar_url ? (
              <AvatarImage src={message.sender_profile.avatar_url} />
            ) : (
              <AvatarFallback>
                {message.sender_profile?.username && message.sender_profile.username.length > 0
                  ? message.sender_profile.username[0].toUpperCase()
                  : <UserIcon className="h-4 w-4" />}
              </AvatarFallback>
            )}
          </Avatar>
        )}
        
        <div className="relative group">
          <div 
            className={`p-3 rounded-lg overflow-hidden ${
              isSentByMe 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words max-w-full">
              {message.content}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatMessageTime(message.created_at)}
          </p>
          
          {isSentByMe && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 absolute top-0 -right-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDeleteMessage(message.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
