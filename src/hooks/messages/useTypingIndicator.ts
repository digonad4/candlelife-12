
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMessagesContext } from './types';

export const useTypingIndicator = () => {
  const { user } = useMessagesContext();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<Record<string, { isTyping: boolean, timestamp: number }>>({});

  useEffect(() => {
    if (!user) return;
    
    // Set up a channel to listen for typing events
    const channel = supabase
      .channel('typing-status')
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload && payload.payload.sender !== user.id) {
          const { sender, recipient, isTyping } = payload.payload;
          
          // Only update typing status if the message is for the current user
          if (recipient === user.id) {
            setTypingUsers(prev => ({
              ...prev,
              [sender]: { isTyping, timestamp: Date.now() }
            }));
          }
        }
      })
      .subscribe();
      
    // Clean up typing indicators after 3 seconds of inactivity
    const intervalId = setInterval(() => {
      setTypingUsers(prev => {
        const now = Date.now();
        const updated = { ...prev };
        let changed = false;
        
        Object.entries(updated).forEach(([userId, status]) => {
          // If typing status is more than 3 seconds old, remove it
          if (status.isTyping && now - status.timestamp > 3000) {
            updated[userId] = { ...status, isTyping: false };
            changed = true;
          }
        });
        
        return changed ? updated : prev;
      });
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
  
  // Function to broadcast typing status
  const sendTypingStatus = async (recipientId: string, isTyping: boolean) => {
    if (!user) return;
    
    await supabase
      .channel('typing-status')
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { 
          sender: user.id, 
          recipient: recipientId, 
          isTyping 
        }
      });
  };
  
  const isUserTyping = (userId: string): boolean => {
    return !!typingUsers[userId]?.isTyping;
  };
  
  return {
    sendTypingStatus,
    isUserTyping
  };
};
