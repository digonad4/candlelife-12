
import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Heart, MessageCircle, Share, MoreHorizontal, 
  Send, Trash, Edit, Loader2 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { usePosts, Post, Comment } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type PostItemProps = {
  post: Post;
  onEdit: (post: Post) => void;
};

export function PostItem({ post, onEdit }: PostItemProps) {
  const { user } = useAuth();
  const { 
    getComments, 
    addComment, 
    deleteComment, 
    deletePost 
  } = usePosts();
  
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isAuthor = user?.id === post.user_id;
  const authorName = post.profiles?.username || "Usuário";
  const authorAvatar = post.profiles?.avatar_url || null;
  
  // Buscar comentários quando showComments for true
  const { 
    data: comments = [], 
    isLoading: isLoadingComments,
    refetch: refetchComments
  } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => getComments(post.id),
    enabled: showComments,
  });
  
  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) {
      refetchComments();
    }
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment.mutateAsync({
        postId: post.id,
        content: newComment.trim()
      });
      setNewComment("");
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({
        commentId,
        postId: post.id
      });
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
    }
  };
  
  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      await deletePost.mutateAsync(post.id);
      setConfirmDelete(false);
    } catch (error) {
      console.error("Erro ao excluir post:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const renderComments = (comments: Comment[]) => {
    if (isLoadingComments) {
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
    
    return comments.map((comment) => (
      <div key={comment.id} className="flex gap-2 mb-4">
        <Avatar className="h-8 w-8">
          {comment.profiles?.avatar_url ? (
            <AvatarImage src={comment.profiles.avatar_url} />
          ) : (
            <AvatarFallback>
              {comment.profiles?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="bg-muted p-2 rounded-lg relative group">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-sm">
                {comment.profiles?.username || "Usuário"}
              </h4>
              
              {user?.id === comment.user_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
                  onClick={() => handleDeleteComment(comment.id)}
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
    ));
  };
  
  const formatPostDate = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR
    });
  };

  return (
    <>
      <Card key={post.id} className="border-border mb-6">
        <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {authorAvatar ? (
                <AvatarImage src={authorAvatar} />
              ) : (
                <AvatarFallback>{authorName[0].toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {authorName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatPostDate(post.created_at)}
                {post.updated_at !== post.created_at && " (editado)"}
              </p>
            </div>
          </div>
          
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(post)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        
        <CardContent>
          <p className="whitespace-pre-line">{post.content}</p>
          
          {post.image_url && (
            <div className="mt-3">
              <img 
                src={post.image_url} 
                alt="Imagem do post" 
                className="rounded-md max-h-96 object-cover" 
              />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col">
          <div className="flex justify-between items-center w-full border-t border-b py-2 mb-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex gap-1 items-center"
            >
              <Heart className="h-5 w-5" />
              <span>0</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex gap-1 items-center"
              onClick={toggleComments}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.comments_count || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex gap-1 items-center"
            >
              <Share className="h-5 w-5" />
            </Button>
          </div>

          {showComments && (
            <div className="w-full space-y-4">
              {renderComments(comments)}
              
              <div className="flex gap-2 mt-4">
                <Avatar className="h-8 w-8">
                  {user?.user_metadata?.avatar_url ? (
                    <AvatarImage src={user.user_metadata.avatar_url} />
                  ) : (
                    <AvatarFallback>
                      {user?.user_metadata?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleAddComment} 
                    disabled={isSubmitting || !newComment.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Diálogo de confirmação para excluir post */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir publicação?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A publicação será permanentemente removida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePost}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
