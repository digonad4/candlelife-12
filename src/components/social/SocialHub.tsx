
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePosts } from "@/hooks/usePosts";
import { useAdvancedMessages } from "@/hooks/useAdvancedMessages";
import { useUserPresence } from "@/hooks/useUserPresence";
import { useTypingStatus } from "@/hooks/useTypingStatus";
import { usePresenceRealtime } from "@/hooks/realtime/usePresenceRealtime";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SocialHeader } from "./SocialHeader";
import { FeedContent } from "./FeedContent";
import { ChatList } from "./chat/ChatList";
import { AdvancedChatModal } from "./chat/AdvancedChatModal";
import { NotificationCenter } from "./NotificationCenter";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "@/components/ui/error-message";

const SocialHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { posts, isLoadingPosts, postsError, refetchPosts } = usePosts();
  const { getChatUsers, getTotalUnreadCount } = useAdvancedMessages();
  const { updateMyPresence } = useUserPresence();
  const { sendTypingStatus } = useTypingStatus();
  
  // Initialize presence realtime subscription
  usePresenceRealtime();
  
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  
  const totalUnreadMessages = getTotalUnreadCount();
  const chatUsers = getChatUsers.data || [];

  // Marcar usuário como online quando entrar na página
  useEffect(() => {
    if (user) {
      updateMyPresence('online');
    }
  }, [user, updateMyPresence]);

  // Verificar autenticação
  useEffect(() => {
    if (!user) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa estar autenticado para acessar a comunidade.",
        variant: "destructive",
      });
      navigate('/login', { replace: true });
    }
  }, [user, toast, navigate]);
  
  // Recarregar posts em caso de erro
  useEffect(() => {
    if (postsError) {
      const timer = setTimeout(() => {
        if (user) {
          refetchPosts();
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [postsError, refetchPosts, user]);
  
  const openChat = (userId: string, userName: string, userAvatar?: string) => {
    if (userId === user?.id) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode iniciar um chat consigo mesmo.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedChatUser({ 
      id: userId, 
      username: userName, 
      avatar_url: userAvatar || "" 
    });
    setIsChatOpen(true);
  };
  
  const handleEditPost = (post: any) => {
    setEditingPost(post);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const handleCancelEdit = () => {
    setEditingPost(null);
  };
  
  const handleRetryFetch = () => {
    refetchPosts();
    toast({
      title: "Recarregando",
      description: "Tentando carregar as publicações novamente...",
    });
  };

  if (postsError && !isLoadingPosts) {
    return (
      <div className="w-full space-y-8 p-4">
        <SocialHeader 
          openChat={openChat}
          totalUnreadMessages={totalUnreadMessages}
          onNotificationCenterToggle={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
        />
        
        <ErrorMessage
          title="Erro ao carregar publicações"
          message="Não foi possível carregar as publicações da comunidade. Por favor, tente novamente em alguns momentos."
          onRetry={handleRetryFetch}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-8 p-2 sm:p-4">
      <SocialHeader 
        openChat={openChat}
        totalUnreadMessages={totalUnreadMessages}
        onNotificationCenterToggle={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
      />

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="mb-4 sm:mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="feed" className="text-sm">
            Feed da Comunidade
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-sm relative">
            Mensagens
            {totalUnreadMessages > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-posts" className="text-sm">
            Minhas Publicações
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed" className="w-full">
          <FeedContent 
            posts={posts}
            isLoadingPosts={isLoadingPosts}
            editingPost={editingPost}
            onEdit={handleEditPost}
            onCancelEdit={handleCancelEdit}
            openChat={openChat}
          />
        </TabsContent>

        <TabsContent value="messages" className="w-full">
          <ChatList 
            chatUsers={chatUsers}
            isLoading={getChatUsers.isLoading}
            onSelectUser={(user) => openChat(user.id, user.username, user.avatar_url)}
          />
        </TabsContent>
        
        <TabsContent value="my-posts" className="w-full">
          <FeedContent 
            posts={posts}
            isLoadingPosts={isLoadingPosts}
            editingPost={editingPost}
            onEdit={handleEditPost}
            onCancelEdit={handleCancelEdit}
            showMyPostsOnly={true}
            currentUserId={user?.id}
            openChat={openChat}
          />
        </TabsContent>
      </Tabs>

      {selectedChatUser && (
        <AdvancedChatModal 
          isOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
          recipientId={selectedChatUser.id}
          recipientName={selectedChatUser.username}
          recipientAvatar={selectedChatUser.avatar_url}
        />
      )}

      <NotificationCenter 
        isOpen={isNotificationCenterOpen}
        onOpenChange={setIsNotificationCenterOpen}
      />
    </div>
  );
};

export default SocialHub;
