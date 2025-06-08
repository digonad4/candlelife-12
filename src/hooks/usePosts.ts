
import { useEffect } from "react";
import { useToast } from "./use-toast";
import { usePostQueries } from "./posts/usePostQueries";
import { usePostMutations } from "./posts/usePostMutations";
import { useCommentMutations } from "./posts/useCommentMutations";
import { useReactionMutations } from "./posts/useReactionMutations";
import { Post, Comment } from "./posts/types";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeSubscription } from "./useRealtimeSubscription";

// Exportando tipos para uso em outros componentes
export type { Post, Comment };

export const usePosts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { 
    posts, 
    isLoadingPosts, 
    postsError, 
    refetchPosts, 
    getComments,
    isUploading,
    setIsUploading
  } = usePostQueries();
  
  const { createPost, updatePost, deletePost } = usePostMutations(setIsUploading);
  const { addComment, deleteComment } = useCommentMutations();
  const { toggleReaction } = useReactionMutations();

  // Efeito para mostrar toast quando há erro na consulta de posts
  useEffect(() => {
    if (postsError) {
      toast({
        title: "Erro",
        description: `Não foi possível carregar as publicações: ${(postsError as Error).message}`,
        variant: "destructive",
      });
    }
  }, [postsError, toast]);

  // Usar o novo hook para subscription robusta
  useRealtimeSubscription({
    channelName: 'posts-realtime',
    filters: [
      {
        event: '*',
        schema: 'public',
        table: 'posts'
      },
      {
        event: '*',
        schema: 'public',
        table: 'comments'
      },
      {
        event: '*',
        schema: 'public',
        table: 'reactions'
      }
    ],
    onSubscriptionChange: () => {
      // Invalidar a query de posts quando houver mudanças
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    dependencies: [user?.id]
  });

  return {
    // Queries
    posts,
    isLoadingPosts,
    postsError,
    isUploading,
    refetchPosts,
    getComments,
    
    // Mutations para posts
    createPost,
    updatePost,
    deletePost,
    
    // Mutations para comentários
    addComment,
    deleteComment,
    
    // Mutations para reações
    toggleReaction
  };
};
