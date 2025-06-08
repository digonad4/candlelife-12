
import React from "react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

type UserSearchResult = {
  id: string;
  username: string;
  avatar_url: string | null;
};

interface UserSearchProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSearching: boolean;
  searchResults: UserSearchResult[];
  onSelectUser: (user: UserSearchResult) => void;
  trigger: React.ReactNode;
}

export const UserSearch = ({
  isOpen,
  onOpenChange,
  searchQuery,
  onSearchChange,
  isSearching,
  searchResults,
  onSelectUser,
  trigger
}: UserSearchProps) => {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Buscar usuários</h3>
          <Input
            placeholder="Digite um nome..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full"
          />
          
          <div className="max-h-48 overflow-y-auto mt-2">
            {isSearching ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => onSelectUser(user)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} />
                        ) : (
                          <AvatarFallback>
                            {user.username[0].toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="truncate">{user.username}</span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : searchQuery.trim().length > 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                Nenhum usuário encontrado
              </p>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
