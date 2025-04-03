
import React from "react";
import { 
  DialogTitle,
  DialogHeader
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, MoreVertical, UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";

interface ChatHeaderProps {
  recipientName: string;
  recipientAvatar?: string;
  onSearchClick: () => void;
  onClearChat: () => void;
}

export const ChatHeader = ({ 
  recipientName, 
  recipientAvatar, 
  onSearchClick, 
  onClearChat 
}: ChatHeaderProps) => {
  return (
    <DialogHeader className="p-4 border-b flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Avatar>
          {recipientAvatar ? (
            <AvatarImage src={recipientAvatar} />
          ) : (
            <AvatarFallback>
              {recipientName && recipientName.length > 0 
                ? recipientName[0].toUpperCase() 
                : <UserIcon className="h-4 w-4" />}
            </AvatarFallback>
          )}
        </Avatar>
        <DialogTitle>{recipientName}</DialogTitle>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onSearchClick}>
          <Search className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={onClearChat}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </DialogHeader>
  );
};
