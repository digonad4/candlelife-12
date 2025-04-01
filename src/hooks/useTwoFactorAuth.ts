
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useAuth } from "@/context/AuthContext";

export type TwoFactorStatus = {
  enabled: boolean;
  secret?: string | null;
};

export const useTwoFactorAuth = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Verificar status atual da 2FA
  const { data: twoFactorStatus, isLoading } = useQuery({
    queryKey: ["twoFactorStatus"],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("two_factor_auth")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao verificar status 2FA:", error);
        throw error;
      }

      // Se não existir registro, criar um com 2FA desabilitado
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("two_factor_auth")
          .insert({
            user_id: user.id,
            enabled: false
          })
          .select()
          .single();

        if (insertError) {
          console.error("Erro ao criar configuração 2FA:", insertError);
          throw insertError;
        }

        return newData;
      }

      return data;
    },
    enabled: !!user,
  });

  // Simulação de configuração de 2FA (em um sistema real, usaríamos bibliotecas específicas para isso)
  const setupTwoFactor = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Gerar um segredo aleatório (na implementação real, usaríamos algo como 'speakeasy')
      const randomSecret = Array.from({ length: 16 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const { data, error } = await supabase
        .from("two_factor_auth")
        .update({
          secret: randomSecret,
          enabled: false // Ainda não está habilitado até a verificação
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao configurar 2FA:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorStatus"] });
      toast({
        title: "Sucesso",
        description: "Código de verificação em duas etapas gerado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível configurar a verificação em duas etapas: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Simulação de verificação de código 2FA
  const verifyTwoFactorCode = useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      if (!twoFactorStatus) throw new Error("Configuração 2FA não encontrada");

      // Em uma implementação real, verificaríamos o código usando algo como 'speakeasy'
      // Aqui estamos simplesmente simulando para fins de demonstração
      const isValid = code.length === 6 && /^\d+$/.test(code);

      if (!isValid) {
        throw new Error("Código inválido");
      }

      const { data, error } = await supabase
        .from("two_factor_auth")
        .update({
          enabled: true
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao verificar código 2FA:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorStatus"] });
      toast({
        title: "Sucesso",
        description: "Verificação em duas etapas ativada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível verificar o código: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Desativar 2FA
  const disableTwoFactor = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("two_factor_auth")
        .update({
          enabled: false,
          secret: null
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao desativar 2FA:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorStatus"] });
      toast({
        title: "Sucesso",
        description: "Verificação em duas etapas desativada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível desativar a verificação em duas etapas: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    twoFactorStatus,
    isLoading,
    setupTwoFactor,
    verifyTwoFactorCode,
    disableTwoFactor
  };
};
