
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { Button } from "./button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { SearchInput } from "../social/header/SearchInput";
import { SearchResults } from "../social/header/SearchResults";
import { ChatUsersList } from "../social/header/ChatUsersList";
import { useMessages } from "@/hooks/useMessages";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type NotificationBadgeProps = {
  openChat: (userId: string, userName: string, userAvatar?: string) => void;
};

export function NotificationBadge({ openChat }: NotificationBadgeProps) {
  const { chatUsers, isLoadingChatUsers, getTotalUnreadCount } = useMessages();
  const totalUnreadMessages = getTotalUnreadCount();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

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
  );
}
