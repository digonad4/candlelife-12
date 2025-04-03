
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, UserIcon, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface SocialHeaderProps {
  openChat: (userId: string, userName: string, userAvatar?: string) => void;
}

type UserSearchResult = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export const SocialHeader = ({ openChat }: SocialHeaderProps) => {
  const { chatUsers, isLoadingChatUsers, getTotalUnreadCount } = useMessages();
  const totalUnreadMessages = getTotalUnreadCount();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

  // Search for users
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
        .limit(5);

      if (error) throw error;

      // Filter out current user
      const filteredData = data.filter(profile => profile.id !== user?.id);
      setSearchResults(filteredData);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search on input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Comunidade</h1>
      
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {totalUnreadMessages > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
                >
                  {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Mensagens</SheetTitle>
            </SheetHeader>
            
            <div className="mt-4 space-y-4">
              <div className="relative">
                <Input
                  placeholder="Buscar usuários..." 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pr-8"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              {searchQuery && searchResults.length > 0 && (
                <div className="border rounded-md shadow-sm p-2 space-y-1">
                  <p className="text-xs text-muted-foreground mb-2">Resultados da busca</p>
                  {searchResults.map((result) => (
                    <div 
                      key={result.id}
                      className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => {
                        openChat(result.id, result.username, result.avatar_url || undefined);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        {result.avatar_url ? (
                          <AvatarImage src={result.avatar_url} alt={result.username} />
                        ) : (
                          <AvatarFallback>
                            {result.username && result.username.length > 0
                              ? result.username[0].toUpperCase()
                              : <UserIcon className="h-4 w-4" />}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="font-medium">{result.username}</span>
                    </div>
                  ))}
                </div>
              )}
            
              <div className="space-y-4">
                {isLoadingChatUsers ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))
                ) : chatUsers.length > 0 ? (
                  chatUsers.map((chatUser) => (
                    <div 
                      key={chatUser.id}
                      className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => {
                        openChat(chatUser.id, chatUser.username, chatUser.avatar_url || undefined);
                      }}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {chatUser.avatar_url ? (
                            <AvatarImage src={chatUser.avatar_url} alt={chatUser.username} />
                          ) : (
                            <AvatarFallback>
                              {chatUser.username && chatUser.username.length > 0
                                ? chatUser.username[0].toUpperCase()
                                : <UserIcon className="h-4 w-4" />}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {chatUser.unread_count > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
                          >
                            {chatUser.unread_count > 9 ? "9+" : chatUser.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{chatUser.username}</p>
                        {chatUser.last_message && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {chatUser.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : searchQuery.trim().length > 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado com "{searchQuery}"
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma conversa iniciada. Clique no nome de um usuário em qualquer publicação para iniciar uma conversa.
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
