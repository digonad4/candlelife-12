
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePosts, Post } from "@/hooks/usePosts";
import { SimpleChatModal } from "@/components/social/chat/SimpleChatModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialHeader } from "@/components/social/SocialHeader";
import { FeedContent } from "@/components/social/FeedContent";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "@/components/ui/error-message";

const Social = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    posts, 
    isLoadingPosts, 
    postsError, 
    refetchPosts 
  } = usePosts();
  
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState({ id: "", name: "", avatar: "" });
  
  // Show error if not authenticated
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
  
  // Effect to try reloading posts when there's an error
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
  
  // Listen for custom events to open chat
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent<{ userId: string; userName: string; userAvatar?: string }>) => {
      const { userId, userName, userAvatar } = event.detail;
      openChat(userId, userName, userAvatar);
    };
    
    window.addEventListener('open-chat' as any, handleOpenChat as EventListener);
    
    return () => {
      window.removeEventListener('open-chat' as any, handleOpenChat as EventListener);
    };
  }, []);
  
  const openChat = (userId: string, userName: string, userAvatar?: string) => {
    // Don't allow chat with the user themselves
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
    // Scroll to the editor
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

  // If there's an error, display error message with button to try again
  if (postsError && !isLoadingPosts) {
    return (
      <div className="w-full space-y-8 p-4">
        <SocialHeader openChat={openChat} />
        
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
      <SocialHeader openChat={openChat} />

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="mb-4 sm:mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="feed" className="text-sm">Feed da Comunidade</TabsTrigger>
          <TabsTrigger value="my-posts" className="text-sm">Minhas Publicações</TabsTrigger>
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

      <SimpleChatModal 
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        recipientId={chatRecipient.id}
        recipientName={chatRecipient.name}
        recipientAvatar={chatRecipient.avatar}
      />
    </div>
  );
}

export default Social;
