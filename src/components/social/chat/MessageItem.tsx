
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/hooks/messages/types";
import { MoreVertical, Trash2, Check, CheckCheck, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageAttachment } from "./MessageAttachment";

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
  isLastInGroup,
}: MessageItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  
  const isCurrentUserMessage = message.sender_id === currentUserId;
  
  const { 
    sender_profile, 
    recipient_profile,
    attachment_url,
    attachment_type,
    attachment_name
  } = message;
  
  const profile = isCurrentUserMessage ? recipient_profile : sender_profile;
  
  const senderName = sender_profile?.username || "Usuário";
  const senderAvatar = sender_profile?.avatar_url;

  const formattedTime = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
    locale: ptBR
  });
  
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
      className={`group flex ${isCurrentUserMessage ? "justify-end" : "justify-start"} mb-1`}
    >
      {!isCurrentUserMessage && isFirstInGroup && (
        <Avatar className="h-8 w-8 mr-2 mt-2">
          {senderAvatar ? (
            <AvatarImage src={senderAvatar} />
          ) : (
            <AvatarFallback>{senderName.charAt(0).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
      )}
      
      {!isCurrentUserMessage && !isFirstInGroup && (
        <div className="w-8 mr-2"></div>
      )}
      
      <div className="max-w-[75%]">
        {!isCurrentUserMessage && isFirstInGroup && (
          <div className="text-xs text-muted-foreground ml-1 mb-1">
            {senderName}
          </div>
        )}
        
        <div className={`relative ${isCurrentUserMessage ? "text-right" : ""}`}>
          <div
            className={`inline-block rounded-lg p-3 ${
              isCurrentUserMessage
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            } ${!isLastInGroup ? "mb-1" : ""}`}
          >
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[60px] text-foreground bg-background"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCancelEdit}
                    className="h-7 w-7"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSaveEdit}
                    className="h-7 w-7"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                
                {attachment_url && (
                  <MessageAttachment 
                    url={attachment_url} 
                    type={attachment_type} 
                    name={attachment_name} 
                  />
                )}
                
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-xs opacity-70">
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </span>
                  
                  {isCurrentUserMessage && (
                    <div className="ml-1">
                      {message.read ? (
                        <CheckCheck className="h-3 w-3 text-primary" />
                      ) : (
                        <Check className="h-3 w-3 opacity-70" />
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {isCurrentUserMessage && !isEditing && (
            <div className="absolute top-0 right-0 -mr-7 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-3 w-3 mr-2" />
                    <span>Editar</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteMessage(message.id)}>
                    <Trash2 className="h-3 w-3 mr-2" />
                    <span>Excluir</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
