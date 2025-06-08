
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Post } from "./types";

export const usePostMutations = (setIsUploading: (value: boolean) => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Criar um novo post
  const createPost = useMutation({
    mutationFn: async ({
      content,
      imageFile,
    }: {
      content: string;
      imageFile?: File;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      let imageUrl: string | null = null;

      // Upload da imagem se existir
      if (imageFile) {
        setIsUploading(true);
        const fileExt = imageFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("post_images")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("Erro ao fazer upload da imagem:", uploadError);
          setIsUploading(false);
          throw uploadError;
        }

        // Obter URL pública da imagem
        const { data: urlData } = supabase.storage
          .from("post_images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
        setIsUploading(false);
      }

      // Criar o post no banco de dados
      const { data, error } = await supabase
        .from("posts")
        .insert({
          content,
          user_id: user.id,
          image_url: imageUrl,
        })
        .select(
          `
          *,
          profiles:user_id(username, avatar_url)
        `
        )
        .single();

      if (error) {
        console.error("Erro ao criar post:", error);
        throw error;
      }

      return { ...data, comments_count: 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Sucesso",
        description: "Publicação criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível criar a publicação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Atualizar um post existente
  const updatePost = useMutation({
    mutationFn: async ({
      id,
      content,
      imageFile,
      keepExistingImage = true,
    }: {
      id: string;
      content: string;
      imageFile?: File;
      keepExistingImage?: boolean;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar o post atual para verificar a imagem existente
      const { data: existingPost, error: fetchError } = await supabase
        .from("posts")
        .select("image_url, user_id")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Erro ao buscar post existente:", fetchError);
        throw fetchError;
      }

      // Verificar se o usuário é o dono do post
      if (existingPost.user_id !== user.id) {
        throw new Error("Você não tem permissão para editar este post");
      }

      let imageUrl = keepExistingImage ? existingPost.image_url : null;

      // Se tiver um novo arquivo de imagem, fazer upload
      if (imageFile) {
        setIsUploading(true);
        const fileExt = imageFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        // Excluir imagem antiga se existir e estiver sendo substituída
        if (existingPost.image_url && (imageFile || !keepExistingImage)) {
          try {
            const oldPath = existingPost.image_url.split("/").pop();
            if (oldPath) {
              await supabase.storage.from("post_images").remove([`${user.id}/${oldPath}`]);
            }
          } catch (e) {
            console.error("Erro ao excluir imagem antiga:", e);
          }
        }

        // Upload da nova imagem
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("post_images")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("Erro ao fazer upload da imagem:", uploadError);
          setIsUploading(false);
          throw uploadError;
        }

        // Obter URL pública da imagem
        const { data: urlData } = supabase.storage
          .from("post_images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
        setIsUploading(false);
      }

      // Atualizar o post no banco de dados
      const { data, error } = await supabase
        .from("posts")
        .update({
          content,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(
          `
          *,
          profiles:user_id(username, avatar_url)
        `
        )
        .single();

      if (error) {
        console.error("Erro ao atualizar post:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Sucesso",
        description: "Publicação atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível atualizar a publicação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Excluir um post
  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar o post para verificar se há imagem para excluir
      const { data: existingPost, error: fetchError } = await supabase
        .from("posts")
        .select("image_url")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Erro ao buscar post para exclusão:", fetchError);
        throw fetchError;
      }

      // Excluir a imagem do storage se existir
      if (existingPost.image_url) {
        try {
          const filePath = existingPost.image_url.split("/").pop();
          if (filePath) {
            await supabase.storage
              .from("post_images")
              .remove([`${user.id}/${filePath}`]);
          }
        } catch (e) {
          console.error("Erro ao excluir imagem:", e);
        }
      }

      // Excluir o post do banco de dados
      const { error } = await supabase.from("posts").delete().eq("id", id);

      if (error) {
        console.error("Erro ao excluir post:", error);
        throw error;
      }

      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Remover o post da cache local também
      queryClient.setQueryData(["posts"], (oldData: Post[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter((post) => post.id !== deletedId);
      });
      toast({
        title: "Sucesso",
        description: "Publicação excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível excluir a publicação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    createPost,
    updatePost,
    deletePost
  };
};
