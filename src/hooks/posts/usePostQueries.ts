
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

        // Primeiro buscar todos os posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("Erro ao buscar posts:", postsError);
          throw new Error(postsError.message);
        }

        if (!postsData) {
          console.log("Nenhum dado retornado, retornando lista vazia");
          return [];
        }

        // Buscar perfis para cada post manualmente em vez de usar joins
        const postsWithProfiles = await Promise.all(
          postsData.map(async (post) => {
            // Buscar perfil do autor
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", post.user_id)
              .single();

            if (profileError) {
              console.error("Erro ao buscar perfil do usuário:", profileError);
              return { 
                ...post, 
                profiles: { username: "Usuário desconhecido", avatar_url: null },
                comments_count: 0 
              };
            }

            // Contar comentários
            const { count, error: countError } = await supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            if (countError) {
              console.error("Erro ao contar comentários:", countError);
              return { 
                ...post, 
                profiles: profileData || { username: "Usuário desconhecido", avatar_url: null },
                comments_count: 0 
              };
            }

            // Retornar post com perfil e contagem de comentários
            return { 
              ...post, 
              profiles: profileData || { username: "Usuário desconhecido", avatar_url: null },
              comments_count: count || 0 
            };
          })
        );

        return postsWithProfiles;
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
      // Buscar comentários
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (commentsError) {
        console.error("Erro ao buscar comentários:", commentsError);
        throw commentsError;
      }

      // Buscar perfis para cada comentário
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", comment.user_id)
            .single();

          if (profileError) {
            console.error("Erro ao buscar perfil para comentário:", profileError);
            return {
              ...comment,
              profiles: { username: "Usuário desconhecido", avatar_url: null }
            };
          }

          return {
            ...comment,
            profiles: profileData || { username: "Usuário desconhecido", avatar_url: null }
          };
        })
      );

      return commentsWithProfiles || [];
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
