
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const ProfileSettings = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!user) return;
      
      console.log("ProfileSettings loading profile for user ID:", user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        throw profileError;
      }

      console.log("ProfileSettings profile data loaded:", profile);

      if (profile) {
        setUsername(profile.username || '');
        setAvatarUrl(profile.avatar_url);
      } else {
        console.log("No profile found, creating one");
        
        // If profile doesn't exist, create one
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ 
            id: user.id, 
            username: user.email?.split('@')[0] || 'Usuário',
            avatar_url: null
          });
          
        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        }
        
        setUsername(user.email?.split('@')[0] || 'Usuário');
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          username,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Informações do Perfil</h2>
        <p className="text-muted-foreground">
          Atualize suas informações de perfil.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Avatar className="w-16 h-16 border border-border">
          <AvatarImage src={avatarUrl || undefined} alt={username} />
          <AvatarFallback>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UserRound className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{username || 'Usuário'}</p>
          <p className="text-sm text-muted-foreground">Altere seu avatar na aba "Avatar"</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Nome de usuário</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Seu nome de usuário"
            disabled={loading}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </span>
          ) : (
            "Salvar alterações"
          )}
        </Button>
      </form>
    </div>
  );
};
