
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Comment } from "@/hooks/usePosts";

type CommentItemProps = {
  comment: Comment;
  currentUserId?: string;
  onDelete: (commentId: string) => void;
};

export function CommentItem({ comment, currentUserId, onDelete }: CommentItemProps) {
  const isAuthor = currentUserId === comment.user_id;

  return (
    <div className="flex gap-2 mb-4">
      <Avatar className="h-8 w-8">
        {comment.profiles?.avatar_url ? (
          <AvatarImage src={comment.profiles.avatar_url} />
        ) : (
          <AvatarFallback>
            {comment.profiles?.username ? comment.profiles.username[0].toUpperCase() : <UserIcon className="h-4 w-4" />}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1">
        <div className="bg-muted p-2 rounded-lg relative group">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-sm">
              {comment.profiles?.username || "Usuário"}
            </h4>
            
            {isAuthor && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
                onClick={() => onDelete(comment.id)}
              >
                <Trash className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(comment.created_at), {
            addSuffix: true,
            locale: ptBR
          })}
        </p>
      </div>
    </div>
  );
}
