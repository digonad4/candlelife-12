
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for backward compatibility
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error.message);
          setLoading(false);
          return;
        }
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error("Unexpected error during session fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Estado de autenticação mudou:", _event);
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error("Erro ao fazer login:", error.message);
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
    } catch (error) {
      console.error("Erro inesperado durante login:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        console.error("Erro ao criar conta:", error.message);
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Conta criada com sucesso",
        description: "Verifique seu email para confirmação",
      });
    } catch (error) {
      console.error("Erro inesperado durante criação de conta:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erro ao fazer logout:", error.message);
        toast({
          title: "Erro ao fazer logout",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      // Clear state after logout
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Até breve!",
      });
    } catch (error) {
      console.error("Erro inesperado durante logout:", error);
      throw error;
    }
  };

  // Alias logout to signOut for backward compatibility
  const logout = signOut;

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div className="flex h-screen items-center justify-center">Carregando...</div>}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
