
import { useState } from "react";
import { Comment } from "@/hooks/usePosts";
import { User } from "@supabase/supabase-js";
import { CommentsList } from "./CommentsList";
import { CommentForm } from "./CommentForm";
import { ErrorMessage } from "@/components/ui/error-message";
import { useToast } from "@/hooks/use-toast";

type CommentsSectionProps = {
  postId: string;
  comments: Comment[];
  isLoading: boolean;
  user: User | null;
  currentUserId?: string;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
};

export function CommentsSection({ 
  postId,
  comments, 
  isLoading, 
  user,
  currentUserId,
  onAddComment,
  onDeleteComment
}: CommentsSectionProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const handleAddComment = async (content: string) => {
    if (!content || content.trim() === "") {
      toast({
        title: "Erro",
        description: "O comentário não pode estar vazio",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onAddComment(content);
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Erro",
        description: `Não foi possível adicionar o comentário: ${(err as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    try {
      await onDeleteComment(commentId);
      toast({
        title: "Sucesso",
        description: "Comentário excluído com sucesso!",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: `Não foi possível excluir o comentário: ${(err as Error).message}`,
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <ErrorMessage
        title="Erro nos comentários"
        message={error.message}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      <CommentsList 
        comments={comments || []} 
        isLoading={isLoading}
        currentUserId={currentUserId}
        onDeleteComment={handleDeleteComment}
        error={null}
      />
      
      <CommentForm 
        user={user} 
        isSubmitting={isSubmitting}
        onSubmit={handleAddComment}
      />
    </div>
  );
}
