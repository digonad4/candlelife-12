
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Post } from "@/hooks/usePosts";
import { PostItem } from "./PostItem";
import { PostEditor } from "./PostEditor";

interface FeedContentProps {
  posts: Post[];
  isLoadingPosts: boolean;
  editingPost: Post | null;
  onEdit: (post: Post) => void;
  onCancelEdit: () => void;
  showMyPostsOnly?: boolean;
  currentUserId?: string;
}

export const FeedContent = ({ 
  posts, 
  isLoadingPosts, 
  editingPost, 
  onEdit, 
  onCancelEdit,
  showMyPostsOnly = false,
  currentUserId
}: FeedContentProps) => {
  const filteredPosts = showMyPostsOnly && currentUserId 
    ? posts.filter(post => post.user_id === currentUserId)
    : posts;

  return (
    <>
      <PostEditor editingPost={editingPost} onCancelEdit={onCancelEdit} />
      
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
      ) : filteredPosts.length > 0 ? (
        filteredPosts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            onEdit={onEdit}
          />
        ))
      ) : (
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {showMyPostsOnly 
                ? "Você ainda não fez nenhuma publicação. Use o editor acima para compartilhar algo com a comunidade!"
                : "Nenhuma publicação encontrada. Seja o primeiro a compartilhar algo com a comunidade!"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};
