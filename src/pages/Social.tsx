
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePosts, Post } from "@/hooks/usePosts";
import { ChatModal } from "@/components/social/ChatModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialHeader } from "@/components/social/SocialHeader";
import { FeedContent } from "@/components/social/FeedContent";

const Social = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { posts, isLoadingPosts } = usePosts();
  
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
