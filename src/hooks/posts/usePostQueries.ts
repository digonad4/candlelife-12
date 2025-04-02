
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Post, Comment, defaultQueryOptions } from "./types";

export const usePostQueries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // Buscar posts com username e avatar do autor
  const { 
    data: posts = [], 
    isLoading: isLoadingPosts, 
    error: postsError, 
    refetch: refetchPosts 
  } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        // Verificar se o usuário está autenticado
        if (!user) {
          console.log("Usuário não autenticado, retornando lista vazia");
          return [];
        }

        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            profiles:user_id(username, avatar_url)
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar posts:", error);
          throw new Error(error.message);
        }

        if (!data) {
          console.log("Nenhum dado retornado, retornando lista vazia");
          return [];
        }

        // Buscar contagem de comentários para cada post
        const postsWithComments = await Promise.all(
          data.map(async (post) => {
            const { count, error: countError } = await supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            if (countError) {
              console.error("Erro ao contar comentários:", countError);
              return { ...post, comments_count: 0 };
            }

            return { ...post, comments_count: count || 0 };
          })
        );

        return postsWithComments;
      } catch (error) {
        console.error("Erro não tratado ao buscar posts:", error);
        throw error;
      }
    },
    ...defaultQueryOptions,
    enabled: !!user,
  });

  // Buscar comentários de um post específico
  const getComments = async (postId: string): Promise<Comment[]> => {
    if (!postId) {
      console.error("ID do post é indefinido ou nulo");
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao buscar comentários:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Erro não tratado ao buscar comentários:", error);
      throw error;
    }
  };

  return {
    posts,
    isLoadingPosts,
    postsError,
    refetchPosts,
    getComments,
    isUploading,
    setIsUploading
  };
};
