
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Post, ReactionType, ReactionResult } from "./types";

export const useReactionMutations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleReaction = useMutation({
    mutationFn: async ({ postId, reactionType }: { 
      postId: string; 
      reactionType: ReactionType 
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Use a stored procedure to toggle the reaction
      const { data: rawData, error } = await supabase
        .rpc("toggle_reaction", {
          p_post_id: postId,
          p_user_id: user.id,
          p_reaction_type: reactionType
        });

      if (error) {
        console.error("Erro ao gerenciar reação:", error);
        throw error;
      }

      // Check if we have data and create a type-safe result
      if (rawData) {
        // Validate that returned data has the expected properties
        const validatedData = {
          postId: postId,
          reactionType: reactionType,
          action: (rawData.action || 'updated') as 'added' | 'updated' | 'removed',
          previousType: null as ReactionType | null
        };

        // Safe type conversion for previousType if it exists
        if (rawData.previousType) {
          const validTypes: ReactionType[] = ['like', 'heart', 'laugh', 'wow', 'sad'];
          if (validTypes.includes(rawData.previousType as ReactionType)) {
            validatedData.previousType = rawData.previousType as ReactionType;
          }
        }

        return validatedData;
      }

      // If no data was returned, provide a default result
      return { 
        postId, 
        reactionType, 
        action: 'updated' as const,
        previousType: null 
      };
    },
    onSuccess: (result) => {
      // Update the local cache to reflect the changes
      queryClient.setQueryData(['posts'], (oldData: Post[] | undefined) => {
        if (!oldData) return [];
        
        return oldData.map((post) => {
          if (post.id === result.postId) {
            // Create a copy of the reactions object
            const reactions = { ...post.reactions };
            
            if (result.action === 'removed') {
              // Decrement the count for the removed reaction type
              reactions[result.reactionType] = Math.max(0, reactions[result.reactionType] - 1);
              return { 
                ...post, 
                reactions, 
                my_reaction: null,
                reactions_count: Math.max(0, post.reactions_count - 1)
              };
            } 
            else if (result.action === 'updated' && result.previousType) {
              // Decrement the previous reaction type count
              reactions[result.previousType] = Math.max(0, reactions[result.previousType] - 1);
              
              // Increment the new reaction type count
              reactions[result.reactionType]++;
              
              return { 
                ...post, 
                reactions, 
                my_reaction: result.reactionType 
              };
            }
            else if (result.action === 'added') {
              // Increment the count for the added reaction type
              reactions[result.reactionType]++;
              
              return { 
                ...post, 
                reactions, 
                my_reaction: result.reactionType,
                reactions_count: post.reactions_count + 1
              };
            }
          }
          return post;
        });
      });
      
      toast({
        title: "Reação atualizada",
        description: "Sua reação foi registrada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível registrar a reação: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return { toggleReaction };
};
