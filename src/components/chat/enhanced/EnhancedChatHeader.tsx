
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, 
  Search, 
  X, 
  Settings, 
  Trash2, 
  Phone, 
  Video,
  Archive,
  Pin,
  VolumeX
} from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface EnhancedChatHeaderProps {
  recipientName: string;
  recipientAvatar?: string;
  isOnline: boolean;
  onSettingsClick: () => void;
  onClearChat: () => void;
  onSearch: (query: string) => void;
  settings?: any;
}

export const EnhancedChatHeader = ({ 
  recipientName, 
  recipientAvatar,
  isOnline,
  onSettingsClick,
  onClearChat,
  onSearch,
  settings
}: EnhancedChatHeaderProps) => {
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

  const displayName = settings?.nickname || recipientName;

  return (
    <DialogHeader className="border-b p-4 shadow-sm bg-gradient-to-r from-primary/5 to-secondary/5">
      {isSearchOpen ? (
        <form 
          className="flex items-center gap-2" 
          onSubmit={handleSearchSubmit}
        >
          <Input
            autoFocus
            type="text"
            placeholder="Pesquisar mensagens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="secondary"
            disabled={searchQuery.trim().length < 2}
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
              <Avatar className="h-10 w-10">
                {recipientAvatar ? (
                  <AvatarImage src={recipientAvatar} alt={displayName} />
                ) : (
                  <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">{displayName}</span>
                {settings?.pinned && (
                  <Pin className="h-3 w-3 text-primary" />
                )}
                {settings?.muted && (
                  <VolumeX className="h-3 w-3 text-muted-foreground" />
                )}
                {settings?.archived && (
                  <Archive className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {isOnline ? "Online agora" : "Visto por último há pouco"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              title="Chamada de voz"
            >
              <Phone className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              title="Chamada de vídeo"
            >
              <Video className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSearchToggle}
              title="Pesquisar mensagens"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onSettingsClick}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações da conversa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClearChat} className="text-destructive">
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
