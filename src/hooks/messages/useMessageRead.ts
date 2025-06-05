
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useMessageRead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const markMessageAsRead = useMutation({
    mutationFn: async ({ messageId, userId }: { messageId: string; userId: string }) => {
      const { error } = await supabase.rpc('mark_message_as_read', {
        p_message_id: messageId,
        p_user_id: userId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['chatUsers'] });
    },
    onError: (error) => {
      console.error('Erro ao marcar mensagem como lida:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a mensagem como lida.",
        variant: "destructive",
      });
    }
  });

  const markConversationAsRead = useMutation({
    mutationFn: async ({ recipientId, senderId }: { recipientId: string; senderId: string }) => {
      const { error } = await supabase.rpc('mark_conversation_as_read', {
        p_recipient_id: recipientId,
        p_sender_id: senderId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['chatUsers'] });
    },
    onError: (error) => {
      console.error('Erro ao marcar conversa como lida:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a conversa como lida.",
        variant: "destructive",
      });
    }
  });

  return {
    markMessageAsRead,
    markConversationAsRead
  };
};
