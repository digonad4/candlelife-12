
import { useState, ReactNode } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Message } from "@/hooks/messages/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { MessageAttachment } from "./MessageAttachment";
import { Badge } from "@/components/ui/badge";

interface MessageItemProps {
  message: Message & { content: string | ReactNode };
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
  const [editedContent, setEditedContent] = useState(typeof message.content === 'string' ? message.content : '');
  const isSender = message.sender_id === currentUserId;
  
  const senderName = message.sender_profile?.username || "Usuário";
  const avatarUrl = message.sender_profile?.avatar_url || null;
  
  const messageTime = format(new Date(message.created_at), 'HH:mm');
  const hasAttachment = !!message.attachment_url;

  const handleEdit = () => {
    if (isEditing && editedContent.trim() !== (typeof message.content === 'string' ? message.content : '')) {
      onEditMessage(message.id, editedContent);
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setEditedContent(typeof message.content === 'string' ? message.content : '');
    setIsEditing(false);
  };

  return (
    <div 
      className={`flex ${isSender ? "justify-end" : "justify-start"} ${!isFirstInGroup ? "mt-1" : "mt-3"}`}
    >
      {!isSender && isFirstInGroup && (
        <Avatar className="h-8 w-8 mr-2">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={senderName} />
          ) : (
            <AvatarFallback>{senderName.charAt(0).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
      )}
      {!isSender && !isFirstInGroup && <div className="w-8 mr-2" />}
      
      <div className="group relative max-w-[75%]">
        {isFirstInGroup && !isSender && (
          <p className="text-xs text-muted-foreground mb-1">{senderName}</p>
        )}
        <div
          className={`rounded-lg p-3 ${
            isSender 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          } ${!isFirstInGroup && isSender ? "rounded-tr-sm" : ""} ${!isFirstInGroup && !isSender ? "rounded-tl-sm" : ""}`}
        >
          {isEditing ? (
            <div className="space-y-2">
              <Textarea 
                value={editedContent} 
                onChange={(e) => setEditedContent(e.target.value)}
                autoFocus
                className="min-h-[60px]"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  variant={isSender ? "secondary" : "default"} 
                  size="sm" 
                  onClick={handleEdit}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
              
              {hasAttachment && (
                <MessageAttachment 
                  url={message.attachment_url!} 
                  type={message.attachment_type} 
                  name={message.attachment_name} 
                />
              )}
              
              <div className="flex items-center justify-end gap-1 mt-1 text-xs">
                <span className={`${isSender ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {messageTime}
                </span>
                
                {isSender && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1 h-4">
                    {message.read ? "Lida" : "Enviada"}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
        
        {isSender && !isEditing && (
          <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 bg-background/80" 
              onClick={handleEdit}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 bg-background/80 text-destructive" 
              onClick={() => onDeleteMessage(message.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
