
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMessagesContext } from "../types";

export const useDeleteMessage = () => {
  const { user } = useMessagesContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: message, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .single();

      if (fetchError) {
        console.error("Erro ao buscar mensagem:", fetchError);
        throw fetchError;
      }

      if (message.sender_id === user.id) {
        const { error } = await supabase
          .from("messages")
          .delete()
          .eq("id", messageId);

        if (error) {
          console.error("Erro ao excluir mensagem:", error);
          throw error;
        }
      } else if (message.recipient_id === user.id) {
        const { error } = await supabase
          .from("messages")
          .update({ deleted_by_recipient: true })
          .eq("id", messageId);

        if (error) {
          console.error("Erro ao marcar mensagem como excluída:", error);
          throw error;
        }
      } else {
        throw new Error("Você não tem permissão para excluir esta mensagem");
      }

      return {
        messageId,
        otherUserId: message.sender_id === user.id ? message.recipient_id : message.sender_id
      };
    },
    onSuccess: ({ otherUserId }) => {
      queryClient.invalidateQueries({ queryKey: ["chatUsers"] });
      queryClient.invalidateQueries({ queryKey: ["chat", otherUserId] });

      toast({
        title: "Mensagem excluída",
        description: "A mensagem foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível excluir a mensagem: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
