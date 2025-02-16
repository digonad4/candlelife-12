
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const AvatarSettings = () => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user?.id)
        .single();

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    } catch (error) {
      console.error("Erro ao carregar avatar:", error);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para fazer upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Avatar atualizado",
        description: "Seu avatar foi atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao fazer upload do avatar:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o avatar.",
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
        <p className="text-muted-foreground">
          Atualize sua foto de perfil.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>
            {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Avatar"}
          </AvatarFallback>
        </Avatar>

        <Button
          variant="outline"
          disabled={uploading}
          onClick={() => document.getElementById('avatar-upload')?.click()}
        >
          {uploading ? "Enviando..." : "Alterar avatar"}
        </Button>
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
  );
};
