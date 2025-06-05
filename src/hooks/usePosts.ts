
import { useEffect, useRef } from "react";
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
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);
  const isSubscribingRef = useRef<boolean>(false);
  
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
    const currentUserId = user?.id || null;
    
    // If user changed or logged out, clean up existing channel
    if (userIdRef.current !== currentUserId) {
      if (channelRef.current) {
        console.log("🛑 User changed, cleaning up posts channel");
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn("Error removing channel:", error);
        }
        channelRef.current = null;
        isSubscribingRef.current = false;
      }
      userIdRef.current = currentUserId;
    }

    if (!currentUserId) {
      return;
    }

    // If we already have a channel or are subscribing, don't create another one
    if (channelRef.current || isSubscribingRef.current) {
      console.log("📡 Posts subscription already active or in progress, skipping");
      return;
    }

    // Set subscribing flag to prevent concurrent subscriptions
    isSubscribingRef.current = true;

    // Create unique channel name to avoid conflicts
    const channelName = `posts-realtime-${currentUserId}-${Date.now()}`;
    console.log("📡 Creating new posts channel:", channelName);
    
    const channel = supabase
      .channel(channelName)
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
      );

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log("Posts channel subscription status:", status);
      if (status === 'SUBSCRIBED') {
        console.log("✅ Posts channel successfully subscribed");
        // Only store the channel reference after successful subscription
        channelRef.current = channel;
        isSubscribingRef.current = false;
      } else if (status === 'CLOSED') {
        console.log("🛑 Posts channel subscription closed");
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
        isSubscribingRef.current = false;
      } else if (status === 'CHANNEL_ERROR') {
        console.log("❌ Posts channel subscription error");
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
        isSubscribingRef.current = false;
      }
    });

    return () => {
      console.log("🛑 Cleaning up posts channel:", channelName);
      isSubscribingRef.current = false;
      if (channelRef.current === channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn("Error removing channel:", error);
        }
        channelRef.current = null;
      }
    };
  }, [user?.id, queryClient]);

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
