
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export const useSendMessage = () => {
  const { user } = useAuth();
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
      }

      // Insert message with attachment info if present
      const insertData = {
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim(),
        read: false,
        deleted_by_recipient: false
      };

      // Only add attachment_url if there's an attachment
      if (attachmentUrl) {
        Object.assign(insertData, { attachment_url: attachmentUrl });
      }

      const { data, error } = await supabase
        .from("messages")
        .insert(insertData)
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
