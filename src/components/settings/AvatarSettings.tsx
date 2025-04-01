
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const AvatarSettings = () => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAvatar();
    }
  }, [user]);

  const loadAvatar = async () => {
    try {
      setUploading(true); // Usamos uploading como loading aqui para consistência com o estado visual
      if (!user) return;

      console.log("AvatarSettings loading avatar for user ID:", user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url, username")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error loading avatar:", profileError);
        throw profileError;
      }

      console.log("AvatarSettings profile data loaded:", profile);

      if (profile) {
        setAvatarUrl(profile.avatar_url || null);
        setUsername(profile.username || "");
      } else {
        console.log("No profile found, creating one");

        // Se o perfil não existir, cria um novo
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            username: user.email?.split("@")[0] || "Usuário",
            avatar_url: null,
          });

        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        }

        setUsername(user.email?.split("@")[0] || "Usuário");
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error("Erro ao carregar avatar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu avatar.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Você precisa selecionar uma imagem para fazer upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = fileName;

      console.log("Uploading avatar:", filePath);

      // Verifica se o bucket "avatars" existe, cria se necessário
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find((bucket) => bucket.name === "avatars")) {
        await supabase.storage.createBucket("avatars", {
          public: true,
        });
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      console.log("Avatar uploaded, public URL:", publicUrl);

      // We need to include username in the update
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
          username: username || user.email?.split("@")[0] || "Usuário",
        });

      if (updateError) throw updateError;

      console.log("Profile updated with new avatar");
      setAvatarUrl(publicUrl);

      toast({
        title: "Avatar atualizado",
        description: "Seu avatar foi atualizado com sucesso.",
      });
    } catch (error: unknown) {
      console.error("Erro ao fazer upload do avatar:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível atualizar o avatar.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Avatar</h2>
        <p className="text-muted-foreground">Atualize sua foto de perfil.</p>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <Avatar className="w-32 h-32 border border-border">
          <AvatarImage src={avatarUrl || undefined} alt={username} />
          <AvatarFallback>
            {uploading ? <Loader2 className="w-10 h-10 animate-spin" /> : <UserRound className="w-10 h-10" />}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-3">
          <p className="text-center sm:text-left">{username || "Usuário"}</p>
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById("avatar-upload")?.click()}
            className="w-full"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
              </span>
            ) : (
              "Alterar avatar"
            )}
          </Button>
          <label htmlFor="avatar-upload" className="sr-only">Upload Avatar</label>
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            className="hidden"
            onChange={uploadAvatar}
            disabled={uploading}
          />
        </div>
      </div>
    </div>
  );
};
