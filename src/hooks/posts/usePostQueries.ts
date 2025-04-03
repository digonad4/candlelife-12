
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Post, Comment, defaultQueryOptions, ReactionType } from "./types";

export const usePostQueries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const { 
    data: posts = [], 
    isLoading: isLoadingPosts, 
    error: postsError, 
    refetch: refetchPosts 
  } = useQuery({
    queryKey: ["posts"],
    queryFn: async (): Promise<Post[]> => {
      try {
        if (!user) return [];

        const { data: postsData, error: postsQueryError } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (postsQueryError) {
          console.error("Erro ao buscar posts:", postsQueryError);
          throw new Error(postsQueryError.message);
        }

        if (!postsData) return [];

        const postsWithProfiles = await Promise.all(
          postsData.map(async (post) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", post.user_id)
              .single();

            const { count: commentsCount } = await supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            // Get reaction counts directly using normal queries instead of RPC
            const { data: reactionCounts } = await supabase
              .from("reactions")
              .select("type, count(*)")
              .eq("post_id", post.id)
              .group("type");

            // Get total reactions count
            const { count: reactionsCount } = await supabase
              .from("reactions")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            // Get user's reaction if logged in
            const { data: myReactionData } = await supabase
              .from("reactions")
              .select("type")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .maybeSingle();

            // Set default reaction counts
            const reactions = {
              like: 0,
              heart: 0,
              laugh: 0,
              wow: 0,
              sad: 0
            };
            
            // Process reaction counts data
            if (reactionCounts && Array.isArray(reactionCounts) && reactionCounts.length > 0) {
              reactionCounts.forEach((item) => {
                if (item && item.type && typeof reactions[item.type as keyof typeof reactions] !== 'undefined') {
                  reactions[item.type as keyof typeof reactions] = parseInt(item.count);
                }
              });
            }

            // Validate my_reaction to ensure it's one of the allowed types or null
            let typedMyReaction: ReactionType | null = null;
            if (myReactionData && myReactionData.type) {
              const validTypes: ReactionType[] = ['like', 'heart', 'laugh', 'wow', 'sad'];
              if (validTypes.includes(myReactionData.type as ReactionType)) {
                typedMyReaction = myReactionData.type as ReactionType;
              }
            }

            return { 
              ...post, 
              profiles: profileData || { username: "Usuário desconhecido", avatar_url: null },
              comments_count: commentsCount || 0,
              reactions_count: reactionsCount || 0,
              reactions,
              my_reaction: typedMyReaction,
              image_url: post.image_url || null
            } as Post;
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

  const getComments = async (postId: string): Promise<Comment[]> => {
    if (!postId) {
      console.error("ID do post é indefinido ou nulo");
      return [];
    }

    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (commentsError) {
        console.error("Erro ao buscar comentários:", commentsError);
        throw commentsError;
      }

      if (!commentsData || commentsData.length === 0) {
        return [];
      }

      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Erro ao buscar perfis para comentários:", profilesError);
      }

      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }

      const commentsWithProfiles = commentsData.map(comment => {
        const profile = profilesMap.get(comment.user_id);
        return {
          ...comment,
          profiles: profile || { username: "Usuário desconhecido", avatar_url: null }
        };
      });

      return commentsWithProfiles;
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
