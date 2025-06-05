
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChatUser } from "@/types/social";
import { useUserPresence } from "@/hooks/useUserPresence";
import { Circle } from "lucide-react";

interface ChatListProps {
  chatUsers: ChatUser[];
  isLoading: boolean;
  onSelectUser: (user: ChatUser) => void;
}

export const ChatList = ({ chatUsers, isLoading, onSelectUser }: ChatListProps) => {
  const { isUserOnline, getLastSeen } = useUserPresence();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (chatUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhuma conversa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Você ainda não iniciou nenhuma conversa. 
            Use o feed da comunidade para interagir com outros usuários!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Suas Conversas</h2>
      
      <div className="space-y-2">
        {chatUsers.map((chatUser) => {
          const isOnline = isUserOnline(chatUser.id);
          const lastSeen = getLastSeen(chatUser.id);
          
          return (
            <Card 
              key={chatUser.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              onClick={() => onSelectUser(chatUser)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chatUser.avatar_url} alt={chatUser.username} />
                      <AvatarFallback>
                        {chatUser.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Indicador de status online */}
                    <Circle 
                      className={`absolute -bottom-1 -right-1 h-4 w-4 border-2 border-background ${
                        isOnline ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'
                      }`}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm sm:text-base truncate">
                        {chatUser.username}
                      </h3>
                      {chatUser.is_typing && (
                        <span className="text-xs text-primary animate-pulse">
                          digitando...
                        </span>
                      )}
                    </div>
                    
                    {chatUser.last_message && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {chatUser.last_message.content}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(chatUser.last_message.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                    )}
                    
                    {!isOnline && lastSeen && (
                      <p className="text-xs text-muted-foreground">
                        Visto por último {formatDistanceToNow(new Date(lastSeen), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {chatUser.unread_count > 0 && (
                      <Badge variant="destructive" className="h-6 w-6 flex items-center justify-center p-0">
                        {chatUser.unread_count > 9 ? "9+" : chatUser.unread_count}
                      </Badge>
                    )}
                    
                    {isOnline && (
                      <span className="text-xs text-green-600 font-medium">
                        Online
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
