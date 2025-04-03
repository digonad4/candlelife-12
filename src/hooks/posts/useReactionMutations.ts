
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
    }): Promise<ReactionResult> => {
      if (!user) throw new Error("Usuário não autenticado");

      // Use a stored procedure to toggle the reaction, casting the parameters and entire call to any
      const params = {
        p_post_id: postId,
        p_user_id: user.id,
        p_reaction_type: reactionType
      } as any;
      
      const reactionResult = await supabase
        .rpc("toggle_reaction", params) as any;
      const { data, error } = reactionResult;

      if (error) {
        console.error("Erro ao gerenciar reação:", error);
        throw error;
      }

      // Check if we have data and create a type-safe result
      const rawData = data as any;
      if (rawData) {
        // Create default result with required fields
        const validatedResult: ReactionResult = {
          postId: postId,
          reactionType: reactionType,
          action: (rawData.action || 'updated') as 'added' | 'updated' | 'removed',
          previousType: null
        };

        // Safely handle previousType if it exists
        if (rawData.previousType) {
          const validTypes: ReactionType[] = ['like', 'heart', 'laugh', 'wow', 'sad'];
          if (validTypes.includes(rawData.previousType as ReactionType)) {
            validatedResult.previousType = rawData.previousType as ReactionType;
          }
        }

        return validatedResult;
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
