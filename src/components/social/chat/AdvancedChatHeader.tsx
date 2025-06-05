
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Search, X, Circle } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface AdvancedChatHeaderProps {
  recipientName: string;
  recipientAvatar?: string;
  isOnline: boolean;
  onClearChat: () => void;
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export const AdvancedChatHeader = ({ 
  recipientName, 
  recipientAvatar,
  isOnline,
  onClearChat,
  onSearch,
  isSearching
}: AdvancedChatHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchQuery("");
      onSearch("");
    } else {
      setIsSearchOpen(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <DialogHeader className="border-b p-4 shadow-sm">
      {isSearchOpen ? (
        <form 
          className="flex items-center gap-2" 
          onSubmit={handleSearchSubmit}
        >
          <Input
            autoFocus
            type="text"
            placeholder="Pesquisar na conversa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            disabled={isSearching}
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="secondary"
            disabled={searchQuery.trim().length < 2 || isSearching}
          >
            Buscar
          </Button>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={handleSearchToggle}
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-8 w-8">
                {recipientAvatar ? (
                  <AvatarImage src={recipientAvatar} alt={recipientName} />
                ) : (
                  <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <Circle 
                className={`absolute -bottom-1 -right-1 h-3 w-3 border-2 border-background ${
                  isOnline ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'
                }`}
              />
            </div>
            <div>
              <span className="font-medium">{recipientName}</span>
              {isOnline && (
                <p className="text-xs text-green-600">Online</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSearchToggle}
              title="Pesquisar na conversa"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onClearChat}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar conversa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogTitle>
      )}
    </DialogHeader>
  );
};
