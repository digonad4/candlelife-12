
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, CheckCheck, Clock, Edit, Trash2, X } from "lucide-react";
import { Message } from "@/types/social";

interface AdvancedMessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  onDelete: () => void;
  onEdit: (newContent: string) => void;
}

export const AdvancedMessageItem = ({
  message,
  isOwnMessage,
  onDelete,
  onEdit
}: AdvancedMessageItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    switch (message.message_status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} group`}>
      {!isOwnMessage && (
        <Avatar className="h-8 w-8">
          {message.sender_avatar_url ? (
            <AvatarImage src={message.sender_avatar_url} alt={message.sender_username} />
          ) : (
            <AvatarFallback>
              {message.sender_username?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          )}
        </Avatar>
      )}
      
      <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`rounded-lg px-3 py-2 ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          } ${message.is_soft_deleted ? 'opacity-50' : ''}`}
        >
          {message.is_soft_deleted ? (
            <p className="text-sm italic">Mensagem excluída</p>
          ) : isEditing ? (
            <div className="space-y-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEdit();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleEdit}>
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm">{message.content}</p>
              {message.attachment_url && (
                <img 
                  src={message.attachment_url} 
                  alt="Anexo" 
                  className="mt-2 rounded max-w-full h-auto"
                />
              )}
            </>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          <span>
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
              locale: ptBR
            })}
          </span>
          
          {message.edited_at && (
            <span className="italic">(editada)</span>
          )}
          
          {isOwnMessage && getStatusIcon()}
          
          {isOwnMessage && !message.is_soft_deleted && (
            <div className="hidden group-hover:flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
