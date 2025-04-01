
import { Comment } from "@/hooks/usePosts";
import { CommentItem } from "./CommentItem";
import { Loader2 } from "lucide-react";

type CommentsListProps = {
  comments: Comment[];
  isLoading: boolean;
  currentUserId?: string;
  onDeleteComment: (commentId: string) => void;
};

export function CommentsList({ 
  comments, 
  isLoading, 
  currentUserId,
  onDeleteComment 
}: CommentsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (comments.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Nenhum comentário ainda. Seja o primeiro a comentar!
      </div>
    );
  }
  
  return (
    <>
      {comments.map((comment) => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
          currentUserId={currentUserId}
          onDelete={onDeleteComment}
        />
      ))}
    </>
  );
}
