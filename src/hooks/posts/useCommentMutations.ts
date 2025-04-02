
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Post } from "./types";

export const useCommentMutations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    addComment,
    deleteComment
  };
};
