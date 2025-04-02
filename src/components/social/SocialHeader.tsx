
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface SocialHeaderProps {
  openChat: (userId: string, userName: string, userAvatar?: string) => void;
}

export const SocialHeader = ({ openChat }: SocialHeaderProps) => {
  const { chatUsers, isLoadingChatUsers, getTotalUnreadCount } = useMessages();
  const totalUnreadMessages = getTotalUnreadCount();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Reset quaisquer toasts de erro pendentes quando o componente montar
    return () => {
      toast({
        id: "error-notification",
        duration: 0,
        onOpenChange: () => {},
      });
    };
  }, []);

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
            
            <div className="mt-6 space-y-4">
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma conversa iniciada. Clique no nome de um usuário em qualquer publicação para iniciar uma conversa.
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
