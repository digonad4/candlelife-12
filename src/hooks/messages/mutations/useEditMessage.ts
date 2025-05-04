
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMessagesContext } from "../types";

export const useEditMessage = () => {
  const { user } = useMessagesContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Primeiro verificamos se a mensagem pertence ao usuário
      const { data: message, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .single();

      if (fetchError) {
        console.error("Erro ao buscar mensagem:", fetchError);
        throw fetchError;
      }

      if (message.sender_id !== user.id) {
        throw new Error("Você não pode editar mensagens de outros usuários");
      }

      const { data, error } = await supabase
        .from("messages")
        .update({ content })
        .eq("id", messageId)
        .select()
        .single();

      if (error) {
        console.error("Erro ao editar mensagem:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (updatedMessage) => {
      queryClient.invalidateQueries({ queryKey: ["chatUsers"] });
      queryClient.invalidateQueries({ queryKey: ["chat", updatedMessage.recipient_id] });
      
      toast({
        title: "Mensagem atualizada",
        description: "A mensagem foi editada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível editar a mensagem: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
