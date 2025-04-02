import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, UserIcon } from "lucide-react";
import { User } from "@supabase/supabase-js";

// Define as propriedades esperadas pelo componente CommentForm
type CommentFormProps = {
  user: User | null; // Usuário autenticado vindo do Supabase
  isSubmitting: boolean; // Indica se o formulário está sendo enviado
  onSubmit: (content: string) => void; // Função para enviar o comentário
};

// Componente de formulário para adicionar comentários
export function CommentForm({ user, isSubmitting, onSubmit }: CommentFormProps) {
  const [content, setContent] = useState(""); // Estado para o conteúdo do comentário

  // Função para lidar com o envio do comentário
  const handleSubmit = () => {
    if (!content.trim()) return; // Impede envio de comentários vazios
    onSubmit(content); // Chama a função onSubmit passada como prop
    setContent(""); // Reseta o campo após o envio
  };

  return (
    <div className="flex gap-2 mt-4">
      {/* Avatar do usuário */}
      <Avatar className="h-8 w-8">
        {user?.user_metadata?.avatar_url ? (
          <AvatarImage src={user.user_metadata.avatar_url} alt="Avatar do usuário" />
        ) : (
          <AvatarFallback>
            {user?.user_metadata?.username ? (
              user.user_metadata.username[0].toUpperCase() // Primeira letra do username
            ) : (
              <UserIcon className="h-4 w-4" /> // Ícone padrão se não houver username
            )}
          </AvatarFallback>
        )}
      </Avatar>

      {/* Campo de entrada e botão de envio */}
      <div className="flex-1 flex gap-2">
        <Input
          placeholder="Escreva um comentário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1"
          disabled={isSubmitting} // Desabilita o input durante o envio
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()} // Desabilita se estiver enviando ou vazio
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" /> // Ícone de carregamento
          ) : (
            <Send className="h-4 w-4" /> // Ícone de envio
          )}
        </Button>
      </div>
    </div>
  );
}