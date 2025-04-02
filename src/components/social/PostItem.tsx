
import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { usePosts, Post, Comment } from "@/hooks/usePosts";
import { useQuery } from "@tanstack/react-query";
import { PostHeader } from "./post/PostHeader";
import { PostContent } from "./post/PostContent";
import { PostActionBar } from "./post/PostActionBar";
import { CommentsSection } from "./post/CommentsSection";
import { DeleteConfirmDialog } from "./post/DeleteConfirmDialog";
import { ErrorMessage } from "@/components/ui/error-message";
import { useToast } from "@/hooks/use-toast";

type PostItemProps = {
  post: Post;
  onEdit: (post: Post) => void;
};

export function PostItem({ post, onEdit }: PostItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    getComments, 
    addComment, 
    deleteComment, 
    deletePost 
  } = usePosts();
  
  const [showComments, setShowComments] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const isAuthor = user?.id === post.user_id;
  const authorName = post.profiles?.username || "Usuário";
  const authorAvatar = post.profiles?.avatar_url || null;
  
  // Buscar comentários quando showComments for true
  const { 
    data: comments = [], 
    isLoading: isLoadingComments,
    refetch: refetchComments,
    error: commentsError
  } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => getComments(post.id),
    enabled: showComments,
    retry: 3,
    retryDelay: 1000,
  });
  
  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) {
      refetchComments();
    }
  };
  
  const handleAddComment = async (content: string) => {
    try {
      await addComment.mutateAsync({
        postId: post.id,
        content: content.trim()
      });
      setError(null);
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      setError(error as Error);
      throw error;
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({
        commentId,
        postId: post.id
      });
      setError(null);
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
      setError(error as Error);
      throw error;
    }
  };
  
  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      await deletePost.mutateAsync(post.id);
      setConfirmDelete(false);
      toast({
        title: "Sucesso",
        description: "Publicação excluída com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao excluir post:", error);
      toast({
        title: "Erro",
        description: `Não foi possível excluir a publicação: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetryComments = () => {
    refetchComments();
    toast({
      title: "Recarregando",
      description: "Tentando carregar os comentários novamente...",
    });
  };

  return (
    <>
      <Card key={post.id} className="border-border mb-6">
        <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2">
          <PostHeader 
            authorName={authorName}
            authorAvatar={authorAvatar}
            createdAt={post.created_at}
            updatedAt={post.updated_at}
            isAuthor={isAuthor}
            onEdit={() => onEdit(post)}
            onDeleteClick={() => setConfirmDelete(true)}
          />
        </CardHeader>
        
        <CardContent>
          <PostContent 
            content={post.content || ""}
            imageUrl={post.image_url}
          />
        </CardContent>
        
        <CardFooter className="flex flex-col">
          <PostActionBar 
            commentsCount={post.comments_count || 0}
            onToggleComments={toggleComments}
          />

          {showComments && (
            commentsError || error ? (
              <ErrorMessage
                title="Erro ao carregar comentários"
                message={(commentsError as Error)?.message || error?.message || "Ocorreu um erro ao carregar os comentários."}
                onRetry={handleRetryComments}
              />
            ) : (
              <CommentsSection 
                postId={post.id}
                comments={comments}
                isLoading={isLoadingComments}
                user={user}
                currentUserId={user?.id}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
              />
            )
          )}
        </CardFooter>
      </Card>
      
      <DeleteConfirmDialog
        isOpen={confirmDelete}
        isDeleting={isDeleting}
        onOpenChange={setConfirmDelete}
        onConfirm={handleDeletePost}
      />
    </>
  );
}
