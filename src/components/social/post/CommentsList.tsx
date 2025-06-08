
import { Comment } from "@/hooks/usePosts";
import { CommentItem } from "./CommentItem";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type CommentsListProps = {
  comments: Comment[];
  isLoading: boolean;
  error?: Error | null;
  currentUserId?: string;
  onDeleteComment: (commentId: string) => void;
};

export function CommentsList({ 
  comments, 
  isLoading, 
  error,
  currentUserId,
  onDeleteComment 
}: CommentsListProps) {
  // Se houver um erro ao carregar
  if (error) {
    return (
      <Alert variant="destructive" className="mb-3">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar comentários: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Se estiver carregando
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Se não houver comentários
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Nenhum comentário ainda. Seja o primeiro a comentar!
      </div>
    );
  }
  
  // Renderiza lista de comentários
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
