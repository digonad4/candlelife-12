
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";
import { useMessagesContext } from "./types";
import { Message } from "./types";

export const useMessageRealtime = () => {
  const { user } = useMessagesContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    // Request notification permission
    if (typeof Notification !== 'undefined' && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

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
                .select("username")
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
                
                // Show browser notification
                if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
                  try {
                    const notification = new Notification(`Nova mensagem de ${senderProfile.username}`, {
                      body: newMessage.content.length > 60 
                        ? newMessage.content.substring(0, 60) + '...' 
                        : newMessage.content,
                      icon: '/favicon.ico',
                      tag: 'new-message', // Prevents duplicate notifications
                      requireInteraction: true // Notification persists until user interacts with it
                    });
                    
                    notification.onclick = () => {
                      window.focus();
                      window.dispatchEvent(new CustomEvent('open-chat', { 
                        detail: { 
                          userId: newMessage.sender_id, 
                          userName: senderProfile.username
                        } 
                      }));
                    };
                  } catch (error) {
                    console.error("Error showing notification:", error);
                  }
                }

                // Emit a custom event that can be caught by any component in the app
                window.dispatchEvent(new CustomEvent('new-message', { 
                  detail: { 
                    senderId: newMessage.sender_id,
                    senderName: senderProfile.username,
                    messageContent: newMessage.content
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
