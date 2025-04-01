
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";
import { PostEditor } from "@/components/social/PostEditor";
import { PostItem } from "@/components/social/PostItem";
import { ChatModal } from "@/components/social/ChatModal";
import { usePosts, Post } from "@/hooks/usePosts";
import { useMessages } from "@/hooks/useMessages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

const Social = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { posts, isLoadingPosts } = usePosts();
  const { chatUsers, isLoadingChatUsers, getTotalUnreadCount } = useMessages();
  
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState({ id: "", name: "", avatar: "" });
  
  // Mostrar erro se não estiver autenticado
  useEffect(() => {
    if (!user) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa estar autenticado para acessar a comunidade.",
        variant: "destructive",
      });
    }
  }, [user, toast]);
  
  const openChat = (userId: string, userName: string, userAvatar?: string) => {
    // Não permitir chat com o próprio usuário
    if (userId === user?.id) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode iniciar um chat consigo mesmo.",
        variant: "destructive",
      });
      return;
    }
    
    setChatRecipient({ 
      id: userId, 
      name: userName, 
      avatar: userAvatar || "" 
    });
    setIsChatOpen(true);
  };
  
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    // Scrollar para o editor
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const handleCancelEdit = () => {
    setEditingPost(null);
  };
  
  const totalUnreadMessages = getTotalUnreadCount();

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
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
                            <AvatarImage src={chatUser.avatar_url} />
                          ) : (
                            <AvatarFallback>{chatUser.username[0].toUpperCase()}</AvatarFallback>
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

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="feed">Feed da Comunidade</TabsTrigger>
          <TabsTrigger value="my-posts">Minhas Publicações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed">
          <PostEditor editingPost={editingPost} onCancelEdit={handleCancelEdit} />
          
          {isLoadingPosts ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="border-border mb-6">
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </Card>
            ))
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onEdit={handleEditPost}
              />
            ))
          ) : (
            <Card className="border-border">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma publicação encontrada. Seja o primeiro a compartilhar algo com a comunidade!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="my-posts">
          <PostEditor editingPost={editingPost} onCancelEdit={handleCancelEdit} />
          
          {isLoadingPosts ? (
            <div className="text-center py-8">Carregando suas publicações...</div>
          ) : (
            <>
              {posts.filter(post => post.user_id === user?.id).length > 0 ? (
                posts
                  .filter(post => post.user_id === user?.id)
                  .map((post) => (
                    <PostItem
                      key={post.id}
                      post={post}
                      onEdit={handleEditPost}
                    />
                  ))
              ) : (
                <Card className="border-border">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Você ainda não fez nenhuma publicação. Use o editor acima para compartilhar algo com a comunidade!
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <ChatModal 
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        recipientId={chatRecipient.id}
        recipientName={chatRecipient.name}
        recipientAvatar={chatRecipient.avatar}
      />
    </div>
  );
};

export default Social;
