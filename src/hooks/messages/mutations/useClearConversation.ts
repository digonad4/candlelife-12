
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMessagesContext } from "../types";

export const useClearConversation = () => {
  const { user } = useMessagesContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Method 1: Use direct queries instead of RPC
      // Delete messages where the current user is the sender
      const { error: deleteError } = await supabase
        .from("messages")
        .delete()
        .eq("sender_id", user.id)
        .eq("recipient_id", otherUserId);

      if (deleteError) {
        console.error("Erro ao excluir mensagens enviadas:", deleteError);
        throw deleteError;
      }

      // Mark as deleted the messages where the current user is the recipient
      const { error: updateError } = await supabase
        .from("messages")
        .update({ deleted_by_recipient: true })
        .eq("recipient_id", user.id)
        .eq("sender_id", otherUserId);

      if (updateError) {
        console.error("Erro ao marcar mensagens como excluídas:", updateError);
        throw updateError;
      }

      return otherUserId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ["chatUsers"] });
      queryClient.invalidateQueries({ queryKey: ["chat", userId] });

      toast({
        title: "Conversa limpa",
        description: "A conversa foi limpa com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível limpar a conversa: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
