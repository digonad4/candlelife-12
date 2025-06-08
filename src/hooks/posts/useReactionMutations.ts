
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReactionType } from "./types";

export const useReactionMutations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleReaction = useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: ReactionType }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // First, check if the user already has a reaction
      const { data: existingReaction, error: fetchError } = await supabase
        .from("reactions")
        .select("type, id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Erro ao verificar reação existente:", fetchError);
        throw fetchError;
      }

      // Determine the action based on existing reaction
      if (!existingReaction) {
        // No existing reaction - add new reaction
        const { error: insertError } = await supabase
          .from("reactions")
          .insert({
            post_id: postId,
            user_id: user.id,
            type: reactionType
          });

        if (insertError) {
          console.error("Erro ao adicionar reação:", insertError);
          throw insertError;
        }

        return {
          action: "added",
          previousType: null,
          postId,
          reactionType
        };
      } else if (existingReaction.type === reactionType) {
        // Same reaction - remove it
        const { error: deleteError } = await supabase
          .from("reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Erro ao remover reação:", deleteError);
          throw deleteError;
        }

        return {
          action: "removed",
          previousType: existingReaction.type,
          postId,
          reactionType
        };
      } else {
        // Different reaction - update it
        const { error: updateError } = await supabase
          .from("reactions")
          .update({ type: reactionType })
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Erro ao atualizar reação:", updateError);
          throw updateError;
        }

        return {
          action: "updated",
          previousType: existingReaction.type,
          postId,
          reactionType
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível registrar sua reação: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return { toggleReaction };
};
