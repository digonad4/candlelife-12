
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";
import { useMessagesContext } from "./types";

export const useMessageMutations = () => {
  const { user } = useMessagesContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      if (!user) throw new Error("Usuário não autenticado");
      if (recipientId === user.id) throw new Error("Você não pode enviar mensagens para si mesmo");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          read: false,
          deleted_by_recipient: false
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao enviar mensagem:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ["chatUsers"] });
      queryClient.invalidateQueries({ queryKey: ["chat", newMessage.recipient_id] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível enviar a mensagem: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const clearConversation = useMutation({
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

  const deleteMessage = useMutation({
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

  return {
    sendMessage,
    clearConversation,
    deleteMessage
  };
};
