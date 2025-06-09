
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Menu, 
  MessageCircle, 
  Bell, 
  Settings, 
  User, 
  LogOut,
  Search,
  Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUnifiedChat } from '@/hooks/useUnifiedChat';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const MainMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { 
    useChatUsers, 
    getTotalUnreadCount 
  } = useUnifiedChat();

  const chatUsersQuery = useChatUsers();
  const chatUsers = chatUsersQuery.data || [];
  const totalUnreadMessages = getTotalUnreadCount();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível sair da conta",
        variant: "destructive",
      });
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${query}%`)
        .neq("id", user?.id)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const openChat = (userId: string, userName: string, userAvatar?: string) => {
    navigate(`/chat/${userId}`, {
      state: {
        username: userName,
        avatar_url: userAvatar
      }
    });
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}min`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Chat Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <MessageCircle className="h-5 w-5" />
            {totalUnreadMessages > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat
            </SheetTitle>
            <SheetDescription>
              Suas conversas e mensagens
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Busca de usuários */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
                />
              </div>

              {/* Resultados da busca */}
              {searchQuery && (
                <div className="space-y-2">
                  {isSearching ? (
                    <div className="text-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground px-1">Usuários encontrados:</p>
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            openChat(user.id, user.username, user.avatar_url);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            {user.avatar_url ? (
                              <AvatarImage src={user.avatar_url} alt={user.username} />
                            ) : (
                              <AvatarFallback>
                                {user.username?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="font-medium">{user.username}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum usuário encontrado
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Lista de conversas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Conversas</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/chat')}
                >
                  Ver todas
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                {chatUsersQuery.isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
                  </div>
                ) : chatUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use a busca acima para encontrar usuários
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {chatUsers.map((chatUser) => (
                      <button
                        key={chatUser.id}
                        onClick={() => openChat(chatUser.id, chatUser.username, chatUser.avatar_url)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            {chatUser.avatar_url ? (
                              <AvatarImage src={chatUser.avatar_url} alt={chatUser.username} />
                            ) : (
                              <AvatarFallback>
                                {chatUser.username?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {chatUser.unread_count > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                            >
                              {chatUser.unread_count > 9 ? "9+" : chatUser.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{chatUser.username}</p>
                            {chatUser.last_message_at && (
                              <span className="text-xs text-muted-foreground">
                                {formatLastMessageTime(chatUser.last_message_at)}
                              </span>
                            )}
                          </div>
                          {chatUser.last_message && (
                            <p className="text-sm text-muted-foreground truncate">
                              {chatUser.last_message}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Menu do usuário */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {user?.user_metadata?.avatar_url ? (
                <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.username} />
              ) : (
                <AvatarFallback>
                  {user?.user_metadata?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-medium">{user?.user_metadata?.username || "Usuário"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
