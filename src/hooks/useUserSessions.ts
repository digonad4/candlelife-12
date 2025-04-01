
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useAuth } from "@/context/AuthContext";

export type UserSession = {
  id: string;
  user_id: string;
  device_info: string;
  last_active: string;
  created_at: string;
  is_current?: boolean;
};

export const useUserSessions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Registrar a sessão atual
  const registerCurrentSession = async () => {
    if (!user) return;
    
    // Obter informações do dispositivo atual
    const deviceInfo = getDeviceInfo();
    
    // Verificar se já existe uma sessão com esse dispositivo
    const { data: existingSessions } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("device_info", deviceInfo);
      
    // Se não existir, criar uma nova
    if (!existingSessions || existingSessions.length === 0) {
      await supabase
        .from("user_sessions")
        .insert({
          user_id: user.id,
          device_info: deviceInfo,
        });
    } else {
      // Se existir, atualizar o timestamp
      await supabase
        .from("user_sessions")
        .update({ last_active: new Date().toISOString() })
        .eq("id", existingSessions[0].id);
    }
  };

  // Obter informações sobre o dispositivo
  const getDeviceInfo = () => {
    const browser = getBrowser();
    const os = getOS();
    return `${browser} em ${os}`;
  };

  // Identificar o navegador
  const getBrowser = () => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf("Firefox") > -1) {
      return "Firefox";
    } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
      return "Opera";
    } else if (userAgent.indexOf("Trident") > -1) {
      return "Internet Explorer";
    } else if (userAgent.indexOf("Edge") > -1) {
      return "Edge";
    } else if (userAgent.indexOf("Chrome") > -1) {
      return "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      return "Safari";
    } else {
      return "Navegador Desconhecido";
    }
  };

  // Identificar o sistema operacional
  const getOS = () => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf("Win") > -1) {
      return "Windows";
    } else if (userAgent.indexOf("Mac") > -1) {
      return "MacOS";
    } else if (userAgent.indexOf("Linux") > -1) {
      return "Linux";
    } else if (userAgent.indexOf("Android") > -1) {
      return "Android";
    } else if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) {
      return "iOS";
    } else {
      return "Sistema Operacional Desconhecido";
    }
  };

  // Buscar todas as sessões do usuário
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["userSessions"],
    queryFn: async () => {
      if (!user) return [];

      // Registrar ou atualizar a sessão atual
      await registerCurrentSession();
      
      const deviceInfo = getDeviceInfo();
      
      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("last_active", { ascending: false });

      if (error) {
        console.error("Erro ao buscar sessões:", error);
        throw error;
      }

      // Marcar a sessão atual
      return data.map(session => ({
        ...session,
        is_current: session.device_info === deviceInfo
      }));
    },
    enabled: !!user,
  });

  // Encerrar uma sessão específica
  const terminateSession = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar se é a sessão atual
      const currentSession = sessions.find(s => s.is_current && s.id === sessionId);
      if (currentSession) {
        throw new Error("Você não pode encerrar sua sessão atual. Use a opção 'Sair' para isso.");
      }

      const { error } = await supabase
        .from("user_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao encerrar sessão:", error);
        throw error;
      }

      return sessionId;
    },
    onSuccess: (sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
      toast({
        title: "Sucesso",
        description: "Sessão encerrada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível encerrar a sessão: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Encerrar todas as outras sessões
  const terminateAllOtherSessions = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const deviceInfo = getDeviceInfo();
      
      const { error } = await supabase
        .from("user_sessions")
        .delete()
        .eq("user_id", user.id)
        .neq("device_info", deviceInfo);

      if (error) {
        console.error("Erro ao encerrar outras sessões:", error);
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
      toast({
        title: "Sucesso",
        description: "Todas as outras sessões foram encerradas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível encerrar as sessões: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    isLoading,
    terminateSession,
    terminateAllOtherSessions
  };
};
