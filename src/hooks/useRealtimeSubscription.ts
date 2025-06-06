
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface SubscriptionConfig {
  channelName: string;
  onSubscriptionChange?: (payload: any) => void;
  filters?: Array<{
    event: string;
    schema?: string;
    table?: string;
    filter?: string;
  }>;
  dependencies?: any[];
}

export const useRealtimeSubscription = ({
  channelName,
  onSubscriptionChange,
  filters = [],
  dependencies = []
}: SubscriptionConfig) => {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const userIdRef = useRef<string | null>(null);
  
  // Função de cleanup robusta
  const cleanupSubscription = useCallback(() => {
    console.log(`🛑 Cleaning up subscription: ${channelName}`);
    
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
        console.log(`✅ Successfully removed channel: ${channelName}`);
      } catch (error) {
        console.warn(`⚠️ Error removing channel ${channelName}:`, error);
      }
      channelRef.current = null;
    }
    
    isSubscribedRef.current = false;
  }, [channelName]);

  // Função para criar subscription
  const createSubscription = useCallback(() => {
    const currentUserId = user?.id || null;
    
    // Verificar se já existe subscription ativa
    if (isSubscribedRef.current || channelRef.current) {
      console.log(`⏭️ Subscription already active for: ${channelName}`);
      return;
    }

    if (!currentUserId) {
      console.log(`❌ No user ID for subscription: ${channelName}`);
      return;
    }

    // Criar nome único do canal
    const uniqueChannelName = `${channelName}-${currentUserId}-${Date.now()}`;
    console.log(`📡 Creating subscription: ${uniqueChannelName}`);
    
    let channel = supabase.channel(uniqueChannelName);
    
    // Adicionar filtros
    filters.forEach(filter => {
      channel = channel.on(
        'postgres_changes',
        {
          event: filter.event as any,
          schema: filter.schema || 'public',
          table: filter.table,
          filter: filter.filter
        },
        onSubscriptionChange || (() => {})
      );
    });
    
    // Subscribe com tratamento de status
    channel.subscribe((status) => {
      console.log(`📊 Subscription status for ${uniqueChannelName}:`, status);
      
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to: ${uniqueChannelName}`);
        channelRef.current = channel;
        isSubscribedRef.current = true;
      } else if (status === 'CLOSED') {
        console.log(`🛑 Subscription closed: ${uniqueChannelName}`);
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
        isSubscribedRef.current = false;
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Subscription error: ${uniqueChannelName}`);
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
        isSubscribedRef.current = false;
      }
    });
    
  }, [channelName, user?.id, onSubscriptionChange, filters]);

  // Effect principal
  useEffect(() => {
    const currentUserId = user?.id || null;
    
    // Se o usuário mudou, fazer cleanup
    if (userIdRef.current !== currentUserId) {
      if (userIdRef.current !== null) {
        console.log(`👤 User changed from ${userIdRef.current} to ${currentUserId}, cleaning up`);
        cleanupSubscription();
      }
      userIdRef.current = currentUserId;
    }

    if (!currentUserId) {
      console.log(`❌ No user for subscription: ${channelName}`);
      return;
    }

    // Criar subscription se necessário
    createSubscription();

    // Cleanup ao desmontar
    return () => {
      console.log(`🧹 Component unmounting, cleaning up: ${channelName}`);
      cleanupSubscription();
    };
  }, [user?.id, cleanupSubscription, createSubscription, ...dependencies]);

  return {
    isSubscribed: isSubscribedRef.current,
    cleanup: cleanupSubscription
  };
};
