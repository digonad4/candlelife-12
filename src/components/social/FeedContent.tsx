
import { useState } from "react";
import { Post } from "@/hooks/usePosts";
import { PostItem } from "./PostItem";
import { PostEditor } from "./PostEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useOutletContext } from "react-router-dom";

export interface FeedContentProps {
  posts: Post[];
  isLoadingPosts: boolean;
  editingPost: Post | null;
  onEdit: (post: Post) => void;
  onCancelEdit: () => void;
  showMyPostsOnly?: boolean;
  currentUserId?: string;
  openChat: (userId: string, userName: string, userAvatar?: string) => void;
}

export function FeedContent({
  posts,
  isLoadingPosts,
  editingPost,
  onEdit,
  onCancelEdit,
  showMyPostsOnly = false,
  currentUserId,
  openChat
}: FeedContentProps) {
  const { user } = useAuth();
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  
  // Filtrar posts se necessário (para mostrar apenas do usuário atual)
  const filteredPosts = showMyPostsOnly && currentUserId
    ? posts.filter(post => post.user_id === currentUserId)
    : posts;
  
  const toggleExpanded = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  return (
    <div className="space-y-6">
      <PostEditor editingPost={editingPost} onCancelEdit={onCancelEdit} />
      
      {isLoadingPosts ? (
        // Skeletons para carregamento
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-40 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {showMyPostsOnly ? 
            "Você ainda não criou nenhuma publicação." : 
            "Nenhuma publicação encontrada na comunidade."}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              isExpanded={expandedPostId === post.id}
              toggleExpanded={() => toggleExpanded(post.id)}
              onEdit={() => onEdit(post)}
              currentUserId={user?.id}
              openChat={openChat}
            />
          ))}
        </div>
      )}
    </div>
  );
}
