
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { UserPresence } from "@/types/social";

export const useUserPresence = () => {
  const { user } = useAuth();
  const [userPresences, setUserPresences] = useState<Record<string, UserPresence>>({});
  const presenceUpdateInterval = useRef<NodeJS.Timeout>();
  const lastActivityTime = useRef<number>(Date.now());

  // Atualizar presença do usuário atual
  const updateMyPresence = async (status: 'online' | 'away' | 'offline', conversationId?: string) => {
    if (!user) return;

    try {
      await supabase.rpc('update_user_presence', {
        p_user_id: user.id,
        p_status: status,
        p_conversation_id: conversationId
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  // Detectar atividade do usuário
  const trackActivity = () => {
    lastActivityTime.current = Date.now();
  };

  // Setup dos event listeners para atividade
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, []);

  // Gerenciar status de presença baseado na atividade
  useEffect(() => {
    if (!user) return;

    // Marcar como online inicialmente
    updateMyPresence('online');

    // Verificar atividade a cada 30 segundos
    presenceUpdateInterval.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime.current;
      
      if (timeSinceLastActivity > 5 * 60 * 1000) { // 5 minutos
        updateMyPresence('away');
      } else {
        updateMyPresence('online');
      }
    }, 30000);

    // Marcar como offline quando sair
    const handleBeforeUnload = () => {
      updateMyPresence('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (presenceUpdateInterval.current) {
        clearInterval(presenceUpdateInterval.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateMyPresence('offline');
    };
  }, [user]);

  // Escutar mudanças de presença em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('user-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          const presence = payload.new as UserPresence;
          if (presence) {
            setUserPresences(prev => ({
              ...prev,
              [presence.user_id]: presence
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Buscar presenças iniciais
  useEffect(() => {
    const fetchPresences = async () => {
      const { data } = await supabase
        .from('user_presence')
        .select('*');

      if (data) {
        const presenceMap = data.reduce((acc, presence) => {
          acc[presence.user_id] = {
            ...presence,
            status: presence.status as 'online' | 'away' | 'offline'
          };
          return acc;
        }, {} as Record<string, UserPresence>);
        
        setUserPresences(presenceMap);
      }
    };

    fetchPresences();
  }, []);

  const getUserPresence = (userId: string): UserPresence | undefined => {
    return userPresences[userId];
  };

  const isUserOnline = (userId: string): boolean => {
    const presence = getUserPresence(userId);
    return presence?.status === 'online';
  };

  const getLastSeen = (userId: string): string | undefined => {
    const presence = getUserPresence(userId);
    return presence?.last_seen;
  };

  return {
    userPresences,
    updateMyPresence,
    getUserPresence,
    isUserOnline,
    getLastSeen
  };
};
