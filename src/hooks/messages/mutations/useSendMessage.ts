
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMessagesContext } from "../types";

export const useSendMessage = () => {
  const { user } = useMessagesContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      recipientId, 
      content, 
      attachment 
    }: { 
      recipientId: string; 
      content: string;
      attachment?: File | null;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");
      if (recipientId === user.id) throw new Error("Você não pode enviar mensagens para si mesmo");

      // Handle file upload if there's an attachment
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;
      let attachmentName: string | null = null;

      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `message-attachments/${user.id}/${fileName}`;
        
        // Upload to storage
        const { error: uploadError, data: uploadData } = await supabase
          .storage
          .from('message-attachments')
          .upload(filePath, attachment);

        if (uploadError) {
          console.error("Erro ao fazer upload do arquivo:", uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('message-attachments')
          .getPublicUrl(filePath);
          
        attachmentUrl = publicUrl;
        attachmentType = attachment.type;
        attachmentName = attachment.name;
      }

      // Insert message with attachment info if present
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: content.trim(),
          read: false,
          deleted_by_recipient: false,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          attachment_name: attachmentName
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
};
