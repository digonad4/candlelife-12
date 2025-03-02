import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

const Login = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNeedsEmailConfirmation(false);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("As senhas não coincidem");
        }

        if (!acceptedTerms) {
          throw new Error("Você precisa aceitar a política de dados");
        }

        // 1. Primeiro fazer o signup
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("Erro ao criar usuário");

        // 2. Upload do avatar se existir
        let avatarUrl = null;
        if (avatar) {
          const fileExt = avatar.name.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatar);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

          avatarUrl = publicUrl;
        }

        // 3. Criar o perfil do usuário
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            username,
            avatar_url: avatarUrl,
          });

        if (profileError) throw profileError;

        setNeedsEmailConfirmation(true);
        toast({
          title: "Conta criada com sucesso!",
          description: "Por favor, verifique seu email para confirmar sua conta.",
        });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        navigate("/");
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-4 animate-fade-in">
        <Card className="rounded-2xl border-0 shadow-xl backdrop-blur-lg bg-white/90 dark:bg-gray-950/90">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isSignUp ? "Criar conta" : "Entrar"}
            </CardTitle>
          </CardHeader>
          <CardContent>
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

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Seu nome de usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
              )}

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

              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar">Foto (opcional)</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                      required
                    />
                    <Label htmlFor="terms" className="text-sm">
                      Aceito a política de dados e termos de uso
                    </Label>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading 
                    ? "Carregando..." 
                    : (isSignUp ? "Criar conta" : "Entrar")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-xl"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setNeedsEmailConfirmation(false);
                  }}
                >
                  {isSignUp 
                    ? "Já tem uma conta? Entre aqui" 
                    : "Não tem uma conta? Cadastre-se"}
                </Button>
                {!isSignUp && (
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
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
