
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
      console.log("useSendMessage - Starting mutation", { recipientId, content, attachment });
      
      if (!user) {
        console.error("useSendMessage - User not authenticated");
        throw new Error("Usuário não autenticado");
      }
      
      if (recipientId === user.id) {
        console.error("useSendMessage - Cannot send message to self");
        throw new Error("Você não pode enviar mensagens para si mesmo");
      }

      // Handle file upload if there's an attachment
      let attachmentUrl: string | null = null;

      if (attachment) {
        console.log("useSendMessage - Uploading attachment", attachment);
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `message-attachments/${user.id}/${fileName}`;
        
        // Upload to storage
        const { error: uploadError, data: uploadData } = await supabase
          .storage
          .from('message-attachments')
          .upload(filePath, attachment);

        if (uploadError) {
          console.error("useSendMessage - Error uploading file:", uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('message-attachments')
          .getPublicUrl(filePath);
          
        attachmentUrl = publicUrl;
        console.log("useSendMessage - Attachment uploaded, URL:", attachmentUrl);
      }

      // Insert message with attachment info if present
      const insertData = {
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim(),
        read: false,
        deleted_by_recipient: false,
        ...(attachmentUrl && { attachment_url: attachmentUrl })
      };

      console.log("useSendMessage - Inserting message", insertData);

      const { data, error } = await supabase
        .from("messages")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("useSendMessage - Error inserting message:", error);
        throw error;
      }

      console.log("useSendMessage - Message sent successfully", data);
      return data;
    },
    onSuccess: (newMessage) => {
      console.log("useSendMessage - onSuccess", newMessage);
      queryClient.invalidateQueries({ queryKey: ["chatUsers"] });
      queryClient.invalidateQueries({ queryKey: ["chat", newMessage.recipient_id] });
    },
    onError: (error: any) => {
      console.error("useSendMessage - onError", error);
      toast({
        title: "Erro",
        description: `Não foi possível enviar a mensagem: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
