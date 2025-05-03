
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";
import { useMessagesContext } from "./types";
import { Message } from "./types";
import { notificationService } from "@/services/NotificationService";

export const useMessageRealtime = () => {
  const { user } = useMessagesContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    // Inicializa o serviço de notificação
    notificationService.initialize().catch(console.error);
    
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log("Nova mensagem recebida:", payload);
          
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['chatUsers'] });
          
          const newMessage = payload.new as Message;
          if (newMessage.sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: ['chat', newMessage.sender_id] });
            
            const fetchSenderInfo = async () => {
              const { data: senderProfile } = await supabase
                .from("profiles")
                .select("username, avatar_url")
                .eq("id", newMessage.sender_id)
                .single();
                
              if (senderProfile) {
                // Show in-app toast notification
                toast({
                  title: `Nova mensagem de ${senderProfile.username}`,
                  description: newMessage.content.length > 60 
                    ? newMessage.content.substring(0, 60) + '...' 
                    : newMessage.content,
                  duration: 5000,
                });
                
                // Mostrar notificação usando o serviço de notificações
                notificationService.showMessageNotification(
                  `Nova mensagem de ${senderProfile.username}`,
                  newMessage.content.length > 60 
                    ? newMessage.content.substring(0, 60) + '...' 
                    : newMessage.content,
                  { 
                    senderId: newMessage.sender_id, 
                    senderName: senderProfile.username,
                    senderAvatar: senderProfile.avatar_url
                  }
                );

                // Emit a custom event that can be caught by any component in the app
                window.dispatchEvent(new CustomEvent('new-message', { 
                  detail: { 
                    senderId: newMessage.sender_id,
                    senderName: senderProfile.username,
                    messageContent: newMessage.content,
                    senderAvatar: senderProfile.avatar_url
                  } 
                }));
              }
            };
            
            fetchSenderInfo();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, toast]);

  return {};
};
