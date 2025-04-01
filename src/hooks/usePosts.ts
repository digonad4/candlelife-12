
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useAuth } from "@/context/AuthContext";

export type Post = {
  id: string;
  content: string;
  user_id: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  comments_count?: number;
};

export type Comment = {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
};

export const usePosts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  // Buscar posts com username e avatar do autor
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar posts:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as publicações.",
          variant: "destructive",
        });
        return [];
      }

      // Buscar contagem de comentários para cada post
      const postsWithComments = await Promise.all(
        data.map(async (post) => {
          const { count, error: countError } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          if (countError) {
            console.error("Erro ao contar comentários:", countError);
            return { ...post, comments_count: 0 };
          }

          return { ...post, comments_count: count || 0 };
        })
      );

      return postsWithComments;
    },
    enabled: !!user,
  });

  // Buscar comentários de um post específico
  const getComments = async (postId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar comentários:", error);
      throw error;
    }

    return data;
  };

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

  // Adicionar um comentário a um post
  const addComment = useMutation({
    mutationFn: async ({
      postId,
      content,
    }: {
      postId: string;
      content: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select(
          `
          *,
          profiles:user_id(username, avatar_url)
        `
        )
        .single();

      if (error) {
        console.error("Erro ao adicionar comentário:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (newComment) => {
      // Incrementar a contagem de comentários localmente
      queryClient.setQueryData(["posts"], (oldData: Post[] | undefined) => {
        if (!oldData) return [];
        return oldData.map((post) => {
          if (post.id === newComment.post_id) {
            return {
              ...post,
              comments_count: (post.comments_count || 0) + 1,
            };
          }
          return post;
        });
      });
      
      // Invalidar a query de comentários específicos
      queryClient.invalidateQueries({ queryKey: ["comments", newComment.post_id] });
      
      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível adicionar o comentário: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Excluir um comentário
  const deleteComment = useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("comments").delete().eq("id", commentId);

      if (error) {
        console.error("Erro ao excluir comentário:", error);
        throw error;
      }

      return { commentId, postId };
    },
    onSuccess: ({ commentId, postId }) => {
      // Decrementar a contagem de comentários localmente
      queryClient.setQueryData(["posts"], (oldData: Post[] | undefined) => {
        if (!oldData) return [];
        return oldData.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments_count: Math.max(0, (post.comments_count || 0) - 1),
            };
          }
          return post;
        });
      });
      
      // Invalidar a query de comentários específicos
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      
      toast({
        title: "Sucesso",
        description: "Comentário excluído com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível excluir o comentário: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    posts,
    isLoadingPosts,
    isUploading,
    getComments,
    createPost,
    updatePost,
    deletePost,
    addComment,
    deleteComment
  };
};
