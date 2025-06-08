
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical, Pencil, Trash2, UserIcon } from "lucide-react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useState } from "react";
import { usePosts } from "@/hooks/usePosts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PostHeaderProps {
  author: {
    username: string;
    avatar_url?: string | null;
    id: string;
  };
  date: string;
  postId: string;
  canEdit: boolean;
  onEdit: () => void;
  openChat: (userId: string, userName: string, userAvatar?: string) => void;
}

export function PostHeader({ author, date, postId, canEdit, onEdit, openChat }: PostHeaderProps) {
  const { toast } = useToast();
  const { deletePost } = usePosts();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const formattedDate = format(new Date(date), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  });
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deletePost.mutateAsync(postId);
      toast({
        title: "Publicação excluída",
        description: "A publicação foi excluída com sucesso.",
      });
    } catch (err) {
      toast({
        title: "Erro ao excluir",
        description: `Não foi possível excluir a publicação: ${(err as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleOpenChat = () => {
    if (!author || !author.id) {
      console.error("Dados do autor incompletos:", author);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o chat. Dados do usuário incompletos.",
        variant: "destructive",
      });
      return;
    }
    
    openChat(author.id, author.username, author.avatar_url || undefined);
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {author.avatar_url ? (
            <AvatarImage src={author.avatar_url} alt={author.username} />
          ) : (
            <AvatarFallback>
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          )}
        </Avatar>
        
        <div>
          <div 
            className="font-medium cursor-pointer hover:underline" 
            onClick={handleOpenChat}
          >
            {author.username}
          </div>
          <div className="text-xs text-muted-foreground">{formattedDate}</div>
        </div>
      </div>
      
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Opções</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              <span>Editar</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span>Excluir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      <DeleteConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
