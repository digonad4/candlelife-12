
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Post, Comment, defaultQueryOptions, ReactionCount, UserReaction } from "./types";

export const usePostQueries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const { 
    data: posts = [], 
    isLoading: isLoadingPosts, 
    error: postsError, 
    refetch: refetchPosts 
  } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
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

            // Use RPC functions to get reaction details
            const { data: reactionCounts } = await supabase
              .rpc<ReactionCount[]>("get_reaction_counts_by_post", { post_id: post.id });
            
            const { data: reactionsCountData } = await supabase
              .rpc<{ count: number }>("get_total_reactions_count", { post_id: post.id });
            
            const { data: myReactionData } = await supabase
              .rpc<UserReaction>("get_user_reaction", { 
                post_id: post.id,
                user_id: user.id 
              });

            // Set default reaction counts
            const reactions = {
              like: 0,
              heart: 0,
              laugh: 0,
              wow: 0,
              sad: 0
            };
            
            // Update reaction counts from RPC result
            if (reactionCounts && reactionCounts.length > 0) {
              reactionCounts.forEach((item) => {
                if (item.type && reactions.hasOwnProperty(item.type)) {
                  reactions[item.type as keyof typeof reactions] = item.count;
                }
              });
            }

            return { 
              ...post, 
              profiles: profileData || { username: "Usuário desconhecido", avatar_url: null },
              comments_count: commentsCount || 0,
              reactions_count: reactionsCountData?.count || 0,
              reactions,
              my_reaction: myReactionData?.type || null,
              image_url: post.image_url || null
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
