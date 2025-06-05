
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";
import { useMessagesContext } from "./types";
import { Message } from "./types";
import { notificationService } from "@/services/notificationService";

export const useMessageRealtime = () => {
  const { user } = useMessagesContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);
  const isSubscribingRef = useRef<boolean>(false);

  useEffect(() => {
    const currentUserId = user?.id || null;
    
    // If user changed or logged out, clean up existing channel
    if (userIdRef.current !== currentUserId) {
      if (channelRef.current) {
        console.log("🛑 User changed, cleaning up messages channel");
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn("Error removing channel:", error);
        }
        channelRef.current = null;
        isSubscribingRef.current = false;
      }
      userIdRef.current = currentUserId;
    }

    if (!currentUserId) {
      return;
    }
    
    // If we already have a channel or are subscribing, don't create another one
    if (channelRef.current || isSubscribingRef.current) {
      console.log("📡 Messages subscription already active or in progress, skipping");
      return;
    }
    
    // Set subscribing flag to prevent concurrent subscriptions
    isSubscribingRef.current = true;
    
    // Inicializa o serviço de notificação
    notificationService.initialize().catch(console.error);
    
    // Create unique channel name to avoid conflicts
    const channelName = `messages-realtime-${currentUserId}-${Date.now()}`;
    console.log("📡 Creating new messages channel:", channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log("Nova mensagem recebida:", payload);
          
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['chatUsers'] });
          
          const newMessage = payload.new as Message;
          if (newMessage.sender_id !== currentUserId) {
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
                
                // Só mostrar push notification se a mensagem não foi lida
                if (!newMessage.read_at) {
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
                }

                // Emit a custom event that can be caught by any component in the app
                window.dispatchEvent(new CustomEvent('new-message', { 
                  detail: { 
                    senderId: newMessage.sender_id,
                    senderName: senderProfile.username,
                    messageContent: newMessage.content,
                    senderAvatar: senderProfile.avatar_url,
                    isRead: !!newMessage.read_at
                  } 
                }));
              }
            };
            
            fetchSenderInfo();
          }
        }
      );

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log("Messages channel subscription status:", status);
      if (status === 'SUBSCRIBED') {
        console.log("✅ Messages channel successfully subscribed");
        // Only store the channel reference after successful subscription
        channelRef.current = channel;
        isSubscribingRef.current = false;
      } else if (status === 'CLOSED') {
        console.log("🛑 Messages channel subscription closed");
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
        isSubscribingRef.current = false;
      } else if (status === 'CHANNEL_ERROR') {
        console.log("❌ Messages channel subscription error");
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
        isSubscribingRef.current = false;
      }
    });

    return () => {
      console.log("🛑 Cleaning up messages channel:", channelName);
      isSubscribingRef.current = false;
      if (channelRef.current === channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn("Error removing channel:", error);
        }
        channelRef.current = null;
      }
    };
  }, [user?.id, queryClient, toast]);

  return {};
};
