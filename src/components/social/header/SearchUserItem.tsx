
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon } from "lucide-react";

interface SearchUserItemProps {
  id: string;
  username: string;
  avatar_url: string | null;
  onClick: () => void;
}

export const SearchUserItem = ({ id, username, avatar_url, onClick }: SearchUserItemProps) => {
  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
      onClick={onClick}
    >
      <Avatar className="h-8 w-8">
        {avatar_url ? (
          <AvatarImage src={avatar_url} alt={username} />
        ) : (
          <AvatarFallback>
            {username && username.length > 0
              ? username[0].toUpperCase()
              : <UserIcon className="h-4 w-4" />}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="font-medium">{username}</span>
    </div>
  );
};
