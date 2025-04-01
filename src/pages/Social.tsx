import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share, MoreHorizontal, Send, Image as ImageIcon } from "lucide-react";
import { ChatModal } from "@/components/chat/ChatModal";

const MOCK_POSTS = [
  {
    id: "1",
    userId: "user-1",
    userName: "João Silva",
    userAvatar: "",
    content: "Acabei de fechar um ótimo negócio! 🎉 As transações foram registradas no sistema. Alguém mais conseguiu bater a meta de hoje?",
    likes: 12,
    comments: 3,
    timestamp: new Date(Date.now() - 3600000 * 3),
  },
  {
    id: "2",
    userId: "user-2",
    userName: "Maria Oliveira",
    userAvatar: "",
    content: "Estou tendo problemas com o relatório mensal. Alguém pode me ajudar com as configurações?",
    likes: 5,
    comments: 7,
    timestamp: new Date(Date.now() - 3600000 * 5),
  },
  {
    id: "3",
    userId: "user-3",
    userName: "Carlos Mendes",
    userAvatar: "",
    content: "Compartilhando uma dica: utilizem a função de filtro por data nas transações para ter uma visão mais organizada. Melhorou muito meu fluxo de trabalho!",
    likes: 18,
    comments: 4,
    timestamp: new Date(Date.now() - 3600000 * 8),
  },
];

type Comment = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
};

const MOCK_COMMENTS: Record<string, Comment[]> = {
  "1": [
    {
      id: "c1",
      userId: "user-2",
      userName: "Maria Oliveira",
      content: "Parabéns pela conquista! Também consegui bater minha meta hoje.",
      timestamp: new Date(Date.now() - 3600000 * 2),
    },
    {
      id: "c2",
      userId: "user-3",
      userName: "Carlos Mendes",
      content: "Quais estratégias você usou?",
      timestamp: new Date(Date.now() - 3600000 * 1),
    },
  ],
  "2": [
    {
      id: "c3",
      userId: "user-3",
      userName: "Carlos Mendes",
      content: "Posso te ajudar, me chama no chat.",
      timestamp: new Date(Date.now() - 3600000 * 4),
    },
  ],
  "3": [
    {
      id: "c4",
      userId: "user-1",
      userName: "João Silva",
      content: "Ótima dica! Vou implementar isso no meu fluxo também.",
      timestamp: new Date(Date.now() - 3600000 * 7),
    },
  ],
};

const Social = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState({ id: "", name: "", avatar: "" });

  const handlePostSubmit = () => {
    if (!newPost.trim() || !user) return;

    const newPostObj = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.user_metadata?.username || "Usuário",
      userAvatar: user.user_metadata?.avatar_url || "",
      content: newPost,
      likes: 0,
      comments: 0,
      timestamp: new Date(),
    };

    setPosts([newPostObj, ...posts]);
    setNewPost("");
    toast({
      title: "Publicação criada",
      description: "Sua publicação foi compartilhada com sucesso!",
    });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleCommentSubmit = (postId: string) => {
    if (!newComments[postId]?.trim() || !user) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.user_metadata?.username || "Usuário",
      userAvatar: user.user_metadata?.avatar_url,
      content: newComments[postId],
      timestamp: new Date(),
    };

    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, comments: post.comments + 1 } : post
      )
    );

    setNewComments((prev) => ({ ...prev, [postId]: "" }));
  };

  const toggleLike = (postId: string) => {
    const isLiked = likedPosts.includes(postId);

    setLikedPosts((prev) =>
      isLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, likes: isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const openChat = (userId: string, userName: string, userAvatar?: string) => {
    setChatRecipient({ id: userId, name: userName, avatar: userAvatar || "" });
    setIsChatOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Comunidade</h1>

      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              {user?.user_metadata?.avatar_url ? (
                <AvatarImage src={user.user_metadata.avatar_url} />
              ) : (
                <AvatarFallback>
                  {user?.user_metadata?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="No que você está pensando?"
                className="resize-none mb-3"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <Button size="sm" variant="outline" type="button">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Imagem
                </Button>
                <Button size="sm" onClick={handlePostSubmit} disabled={!newPost.trim()}>
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="border-border">
            <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <Avatar 
                  className="h-10 w-10 cursor-pointer" 
                  onClick={() => openChat(post.userId, post.userName, post.userAvatar)}
                >
                  {post.userAvatar ? (
                    <AvatarImage src={post.userAvatar} />
                  ) : (
                    <AvatarFallback>{post.userName[0].toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-semibold hover:underline cursor-pointer" onClick={() => openChat(post.userId, post.userName, post.userAvatar)}>
                    {post.userName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {post.timestamp.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{post.content}</p>
            </CardContent>
            <CardFooter className="flex flex-col">
              <div className="flex justify-between items-center w-full border-t border-b py-2 mb-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex gap-1 items-center"
                  onClick={() => toggleLike(post.id)}
                >
                  <Heart className={`h-5 w-5 ${likedPosts.includes(post.id) ? "fill-red-500 text-red-500" : ""}`} />
                  <span>{post.likes}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex gap-1 items-center"
                  onClick={() => toggleComments(post.id)}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.comments}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex gap-1 items-center">
                  <Share className="h-5 w-5" />
                </Button>
              </div>

              {expandedComments.includes(post.id) && (
                <div className="w-full space-y-4">
                  {comments[post.id]?.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar 
                        className="h-8 w-8 cursor-pointer" 
                        onClick={() => openChat(comment.userId, comment.userName, comment.userAvatar)}
                      >
                        {comment.userAvatar ? (
                          <AvatarImage src={comment.userAvatar} />
                        ) : (
                          <AvatarFallback>{comment.userName[0].toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted p-2 rounded-lg">
                          <h4 className="font-medium text-sm hover:underline cursor-pointer" onClick={() => openChat(comment.userId, comment.userName, comment.userAvatar)}>
                            {comment.userName}
                          </h4>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {comment.timestamp.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-2">
                    <Avatar className="h-8 w-8">
                      {user?.user_metadata?.avatar_url ? (
                        <AvatarImage src={user.user_metadata.avatar_url} />
                      ) : (
                        <AvatarFallback>
                          {user?.user_metadata?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Escreva um comentário..."
                        value={newComments[post.id] || ""}
                        onChange={(e) => setNewComments((prev) => ({ 
                          ...prev, 
                          [post.id]: e.target.value 
                        }))}
                        className="flex-1"
                      />
                      <Button 
                        size="icon" 
                        onClick={() => handleCommentSubmit(post.id)} 
                        disabled={!newComments[post.id]?.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

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
