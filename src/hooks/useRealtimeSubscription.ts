
<<<<<<< HEAD
import { useEffect, useRef } from 'react';
import { realtimeManager } from '@/services/RealtimeManager';
=======
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
>>>>>>> a54c83b6aeb620917159af6bd1e06b32ec0fcdef

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
<<<<<<< HEAD
  const cleanupRef = useRef<(() => void) | null>(null);
  const subscriberIdRef = useRef(`${channelName}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    console.log(`📡 useRealtimeSubscription: Setting up ${channelName}`);

    const cleanup = realtimeManager.subscribe(
      {
        channelName,
        filters,
        onSubscriptionChange
      },
      subscriberIdRef.current
    );

    cleanupRef.current = cleanup;

    return () => {
      console.log(`🧹 useRealtimeSubscription: Cleaning up ${channelName}`);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [channelName, onSubscriptionChange, JSON.stringify(filters), ...dependencies]);

  return {
    isSubscribed: cleanupRef.current !== null,
    cleanup: () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    }
=======
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const isSubscribingRef = useRef<boolean>(false);
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
    isSubscribingRef.current = false;
  }, [channelName]);

  // Função para criar subscription
  const createSubscription = useCallback(() => {
    const currentUserId = user?.id || null;
    
    // Verificar se já existe subscription ativa
    if (isSubscribedRef.current || isSubscribingRef.current) {
      console.log(`⏭️ Subscription already active/in progress for: ${channelName}`);
      return;
    }

    if (!currentUserId) {
      console.log(`❌ No user ID for subscription: ${channelName}`);
      return;
    }

    // Marcar como em progresso
    isSubscribingRef.current = true;
    
    // Criar nome único do canal
    const uniqueChannelName = `${channelName}-${currentUserId}-${Date.now()}`;
    console.log(`📡 Creating subscription: ${uniqueChannelName}`);
    
    let channel = supabase.channel(uniqueChannelName);
    
    // Adicionar filtros
    filters.forEach(filter => {
      channel = channel.on('postgres_changes', filter, onSubscriptionChange || (() => {}));
    });
    
    // Subscribe com tratamento de status
    channel.subscribe((status) => {
      console.log(`📊 Subscription status for ${uniqueChannelName}:`, status);
      
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to: ${uniqueChannelName}`);
        channelRef.current = channel;
        isSubscribedRef.current = true;
        isSubscribingRef.current = false;
      } else if (status === 'CLOSED') {
        console.log(`🛑 Subscription closed: ${uniqueChannelName}`);
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
        isSubscribedRef.current = false;
        isSubscribingRef.current = false;
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Subscription error: ${uniqueChannelName}`);
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
        isSubscribedRef.current = false;
        isSubscribingRef.current = false;
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
    isSubscribing: isSubscribingRef.current,
    cleanup: cleanupSubscription
>>>>>>> a54c83b6aeb620917159af6bd1e06b32ec0fcdef
  };
};
