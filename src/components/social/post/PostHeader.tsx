
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, MoreHorizontal, Edit, Trash } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type PostHeaderProps = {
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  updatedAt: string;
  isAuthor: boolean;
  onEdit: () => void;
  onDeleteClick: () => void;
};

export function PostHeader({ 
  authorName, 
  authorAvatar, 
  createdAt, 
  updatedAt,
  isAuthor,
  onEdit,
  onDeleteClick
}: PostHeaderProps) {
  const formatPostDate = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR
    });
  };

  return (
    <div className="flex flex-row justify-between items-start space-y-0 pb-2">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {authorAvatar ? (
            <AvatarImage src={authorAvatar} />
          ) : (
            <AvatarFallback>
              {authorName && authorName.length > 0 ? authorName[0].toUpperCase() : <UserIcon className="h-5 w-5" />}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h3 className="font-semibold">
            {authorName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatPostDate(createdAt)}
            {updatedAt !== createdAt && " (editado)"}
          </p>
        </div>
      </div>
      
      {isAuthor && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={onDeleteClick}
            >
              <Trash className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
