
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserIcon, Edit, Trash2, Check, X } from "lucide-react";
import { Message } from "@/hooks/messages/types";

interface MessageItemProps {
  message: Message;
  currentUserId?: string;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export const MessageItem = ({ 
  message, 
  currentUserId, 
  onDeleteMessage,
  onEditMessage,
  isFirstInGroup,
  isLastInGroup
}: MessageItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const isSentByMe = message.sender_id === currentUserId;
  
  const formatMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() !== message.content) {
      onEditMessage(message.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };
  
  return (
    <div 
      className={`flex ${isSentByMe ? "justify-end" : "justify-start"} ${
        !isLastInGroup ? "mb-1" : "mb-4"
      }`}
    >
      <div className="flex items-start gap-2 max-w-[80%]">
        {!isSentByMe && isFirstInGroup && (
          <Avatar className="h-8 w-8 shrink-0 mt-1">
            {message.sender_profile?.avatar_url ? (
              <AvatarImage src={message.sender_profile.avatar_url} alt={message.sender_profile.username} />
            ) : (
              <AvatarFallback>
                {message.sender_profile?.username && message.sender_profile.username.length > 0
                  ? message.sender_profile.username[0].toUpperCase()
                  : <UserIcon className="h-4 w-4" />}
              </AvatarFallback>
            )}
          </Avatar>
        )}
        {!isSentByMe && !isFirstInGroup && <div className="w-8 shrink-0" />}
        
        <div className="relative group">
          <div 
            className={`p-3 rounded-lg overflow-hidden ${
              isSentByMe 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            } ${isFirstInGroup && isSentByMe ? "rounded-tr-lg" : "rounded-tr-sm"}
              ${isFirstInGroup && !isSentByMe ? "rounded-tl-lg" : "rounded-tl-sm"}
              ${isLastInGroup && isSentByMe ? "rounded-br-lg" : "rounded-br-sm"}
              ${isLastInGroup && !isSentByMe ? "rounded-bl-lg" : "rounded-bl-sm"}`
            }
          >
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[60px] text-sm p-2 border-muted-foreground/20"
                  placeholder="Digite sua mensagem..."
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant={isSentByMe ? "secondary" : "default"}
                    className="h-7 px-2"
                    onClick={handleSaveEdit}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
          
          {isLastInGroup && !isEditing && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatMessageTime(message.created_at)}
            </p>
          )}
          
          {isSentByMe && !isEditing && (
            <div className="absolute top-1 -right-14 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => onDeleteMessage(message.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
