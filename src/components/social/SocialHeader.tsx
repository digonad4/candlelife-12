
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Import our refactored components
import { SearchInput } from "./header/SearchInput";
import { SearchResults } from "./header/SearchResults";
import { ChatUsersList } from "./header/ChatUsersList";

interface SocialHeaderProps {
  openChat: (userId: string, userName: string, userAvatar?: string) => void;
  totalUnreadMessages: number;
  onNotificationCenterToggle: () => void;
}

type UserSearchResult = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export const SocialHeader = ({ openChat, totalUnreadMessages, onNotificationCenterToggle }: SocialHeaderProps) => {
  const { chatUsers, isLoadingChatUsers } = useMessages();
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

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    openChat(userId, userName, userAvatar);
    setSearchQuery("");
    setSearchResults([]);
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
              <SearchInput 
                value={searchQuery}
                onChange={handleSearchChange}
                isSearching={isSearching}
              />
              
              <SearchResults 
                searchResults={searchResults}
                searchQuery={searchQuery}
                onSelectUser={handleSelectUser}
              />
            
              <ChatUsersList 
                chatUsers={chatUsers}
                isLoadingChatUsers={isLoadingChatUsers}
                searchQuery={searchQuery}
                openChat={openChat}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
