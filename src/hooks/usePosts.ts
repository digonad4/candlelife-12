
import { useEffect } from "react";
import { useToast } from "./use-toast";
import { usePostQueries } from "./posts/usePostQueries";
import { usePostMutations } from "./posts/usePostMutations";
import { useCommentMutations } from "./posts/useCommentMutations";
import { useReactionMutations } from "./posts/useReactionMutations";
import { Post, Comment } from "./posts/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

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

  // Configurar o canal de tempo real para atualização de posts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          // Invalidar a query de posts quando houver mudanças
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        () => {
          // Invalidar a query de posts quando houver mudanças em comentários
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions'
        },
        () => {
          // Invalidar a query de posts quando houver mudanças em reações
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

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
