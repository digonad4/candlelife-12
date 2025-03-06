
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  toggleView: () => void;
}

const LoginForm = ({ toggleView }: LoginFormProps) => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNeedsEmailConfirmation(false);

    try {
      // Login
      await signIn(email, password);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro de autenticação:", error);
      
      if (error.message.includes("Email not confirmed")) {
        setNeedsEmailConfirmation(true);
        toast({
          variant: "destructive",
          title: "Email não confirmado",
          description: "Por favor, verifique seu email e clique no link de confirmação antes de fazer login.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {needsEmailConfirmation && (
        <Alert className="mb-4">
          <AlertDescription>
            Enviamos um email de confirmação para {email}. 
            Por favor, verifique sua caixa de entrada e confirme seu email antes de fazer login.
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Button 
            type="submit" 
            className="w-full rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? "Carregando..." : "Entrar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-xl"
            onClick={toggleView}
          >
            Não tem uma conta? Cadastre-se
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={async () => {
              if (!email) {
                toast({
                  title: "Digite seu email",
                  description: "Digite seu email para receber o link de redefinição de senha.",
                  variant: "destructive",
                });
                return;
              }
              
              try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/change-password`,
                });
                
                if (error) throw error;
                
                toast({
                  title: "Email enviado",
                  description: "Verifique seu email para redefinir sua senha.",
                });
              } catch (error: any) {
                toast({
                  title: "Erro",
                  description: error.message,
                  variant: "destructive",
                });
              }
            }}
          >
            Esqueceu sua senha?
          </Button>
        </div>
      </form>
    </>
  );
};

export default LoginForm;
