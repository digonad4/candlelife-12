
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { MoreVertical, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatSearch } from "./ChatSearch";

interface ChatHeaderProps {
  recipientName: string;
  recipientAvatar?: string;
  onSearchClick: () => void;
  onClearChat: () => void;
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export const ChatHeader = ({
  recipientName,
  recipientAvatar,
  onClearChat,
  onSearch,
  isSearching
}: ChatHeaderProps) => {
  return (
    <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          {recipientAvatar ? (
            <AvatarImage src={recipientAvatar} alt={recipientName} />
          ) : (
            <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
        <DialogTitle className="text-lg font-medium">{recipientName}</DialogTitle>
      </div>

      <div className="flex items-center gap-1">
        <ChatSearch 
          onSearch={onSearch} 
          isSearching={isSearching} 
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClearChat} className="text-destructive">
              Limpar conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </DialogHeader>
  );
};
