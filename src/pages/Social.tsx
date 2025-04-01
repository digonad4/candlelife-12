
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePosts, Post } from "@/hooks/usePosts";
import { ChatModal } from "@/components/social/ChatModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialHeader } from "@/components/social/SocialHeader";
import { FeedContent } from "@/components/social/FeedContent";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
  
  // Mostrar erro se não estiver autenticado
  useEffect(() => {
    if (!user) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa estar autenticado para acessar a comunidade.",
        variant: "destructive",
        duration: 5000,
      });
      navigate('/login', { replace: true });
    }
  }, [user, toast, navigate]);
  
  // Efeito para tentar recarregar posts quando houver erro
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
    // Não permitir chat com o próprio usuário
    if (userId === user?.id) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode iniciar um chat consigo mesmo.",
        variant: "destructive",
        duration: 3000,
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
  
  const handleRetryFetch = () => {
    refetchPosts();
    toast({
      title: "Recarregando",
      description: "Tentando carregar as publicações novamente...",
      duration: 3000,
    });
  };

  // Se houver um erro, exibir mensagem de erro com botão para tentar novamente
  if (postsError && !isLoadingPosts) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
        <SocialHeader openChat={openChat} />
        
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar publicações</AlertTitle>
          <AlertDescription>
            Não foi possível carregar as publicações da comunidade. 
            Por favor, tente novamente em alguns momentos.
          </AlertDescription>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={handleRetryFetch}
          >
            Tentar novamente
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <SocialHeader openChat={openChat} />

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="feed">Feed da Comunidade</TabsTrigger>
          <TabsTrigger value="my-posts">Minhas Publicações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed">
          <FeedContent 
            posts={posts}
            isLoadingPosts={isLoadingPosts}
            editingPost={editingPost}
            onEdit={handleEditPost}
            onCancelEdit={handleCancelEdit}
          />
        </TabsContent>
        
        <TabsContent value="my-posts">
          <FeedContent 
            posts={posts}
            isLoadingPosts={isLoadingPosts}
            editingPost={editingPost}
            onEdit={handleEditPost}
            onCancelEdit={handleCancelEdit}
            showMyPostsOnly={true}
            currentUserId={user?.id}
          />
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
