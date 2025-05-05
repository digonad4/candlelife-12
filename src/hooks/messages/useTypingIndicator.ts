
import { useState, useEffect, useRef } from "react";
import { useMessagesContext, UserTypingStatus } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export const useTypingIndicator = () => {
  const { user } = useMessagesContext();
  const [typingUsers, setTypingUsers] = useState<Map<string, UserTypingStatus>>(new Map());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const channelRef = useRef<any>(null);
  
  // Setup realtime subscription for typing indicators
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`typing-indicators-${user.id}`);
    
    channel
      .on('broadcast', { event: 'typing-status' }, (payload) => {
        const { userId, recipientId, isTyping } = payload.payload as UserTypingStatus;
        
        // Only process typing events meant for current user
        if (recipientId === user.id) {
          handleTypingStatus(userId, recipientId, isTyping);
        }
      })
      .subscribe();
    
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Check if user is typing based on userId
  const isUserTyping = (userId: string) => {
    const status = typingUsers.get(userId);
    return status?.isTyping || false;
  };

  // Handle incoming typing status updates
  const handleTypingStatus = (
    userId: string, 
    recipientId: string, 
    isTyping: boolean
  ) => {
    // Update typing status
    setTypingUsers((prev) => {
      const next = new Map(prev);
      
      if (isTyping) {
        next.set(userId, {
          userId,
          recipientId,
          isTyping,
          lastTyped: new Date()
        });
        
        // Clear previous timeout if any
        if (typingTimeoutRef.current.has(userId)) {
          clearTimeout(typingTimeoutRef.current.get(userId));
        }
        
        // Set timeout to reset typing status after 3 seconds
        const timeoutId = setTimeout(() => {
          setTypingUsers((current) => {
            const updated = new Map(current);
            if (updated.has(userId)) {
              const status = updated.get(userId)!;
              updated.set(userId, { ...status, isTyping: false });
            }
            return updated;
          });
          typingTimeoutRef.current.delete(userId);
        }, 3000);
        
        typingTimeoutRef.current.set(userId, timeoutId);
      } else {
        // If explicitly set to not typing
        if (next.has(userId)) {
          const status = next.get(userId)!;
          next.set(userId, { ...status, isTyping: false });
        }
        
        // Clear timeout
        if (typingTimeoutRef.current.has(userId)) {
          clearTimeout(typingTimeoutRef.current.get(userId));
          typingTimeoutRef.current.delete(userId);
        }
      }
      
      return next;
    });
  };

  // Send typing status to other user
  const sendTypingStatus = (recipientId: string, isTyping: boolean) => {
    if (!user || !channelRef.current) return;
    
    const typingStatus: UserTypingStatus = {
      userId: user.id,
      recipientId,
      isTyping,
      lastTyped: new Date()
    };
    
    // Broadcast typing status
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing-status',
      payload: typingStatus
    });
  };

  return {
    isUserTyping,
    sendTypingStatus
  };
};
