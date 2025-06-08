
import { MoreHorizontal, Trash, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface MessageActionsProps {
  messageId: string;
  onDelete: () => void;
  onEdit: () => void;
}

export const MessageActions = ({ messageId, onDelete, onEdit }: MessageActionsProps) => {
  return (
    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onDelete}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
