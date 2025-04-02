
import { useState } from "react";
import { Post, usePosts } from "@/hooks/usePosts";
import { PostHeader } from "./post/PostHeader";
import { PostContent } from "./post/PostContent";
import { PostActionBar } from "./post/PostActionBar";
import { CommentsSection } from "./post/CommentsSection";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

interface PostItemProps {
  post: Post;
  isExpanded: boolean;
  toggleExpanded: () => void;
  onEdit: () => void;
  currentUserId?: string;
  openChat: (userId: string, userName: string, userAvatar?: string) => void;
}

export function PostItem({ 
  post, 
  isExpanded, 
  toggleExpanded, 
  onEdit, 
  currentUserId,
  openChat
}: PostItemProps) {
  const { user } = useAuth();
  const { getComments, addComment, deleteComment, toggleReaction } = usePosts();
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  
  // Fetch comments when the post is expanded
  const handleToggleComments = async () => {
    // If already expanded, just close
    if (isExpanded) {
      toggleExpanded();
      return;
    }
    
    // If not expanded yet, fetch comments and open
    try {
      setIsLoadingComments(true);
      const postComments = await getComments(post.id);
      setComments(postComments);
      toggleExpanded();
    } catch (err) {
      console.error("Erro ao carregar comentários:", err);
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  // Add a comment - fixing the return type to void
  const handleAddComment = async (content: string): Promise<void> => {
    if (!user) return;
    
    try {
      await addComment.mutateAsync({
        postId: post.id,
        content
      });
      
      // Reload comments after adding a new one
      const updatedComments = await getComments(post.id);
      setComments(updatedComments);
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    }
  };
  
  // Delete a comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ 
        commentId, 
        postId: post.id 
      });
      
      // Reload comments after deleting
      const updatedComments = await getComments(post.id);
      setComments(updatedComments);
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
      throw error;
    }
  };
  
  // Add a reaction
  const handleReact = async (type: 'like' | 'heart' | 'laugh' | 'wow' | 'sad') => {
    try {
      await toggleReaction.mutateAsync({
        postId: post.id,
        reactionType: type
      });
    } catch (error) {
      console.error("Erro ao reagir:", error);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-6 space-y-4">
        <PostHeader 
          author={{
            username: post.profiles?.username || "Usuário",
            avatar_url: post.profiles?.avatar_url,
            id: post.user_id
          }}
          date={post.created_at} 
          postId={post.id}
          canEdit={currentUserId === post.user_id}
          onEdit={onEdit}
          openChat={openChat}
        />
        
        <PostContent 
          content={post.content} 
          imageUrl={post.image_url} 
        />
        
        <PostActionBar 
          commentsCount={post.comments_count || 0} 
          onToggleComments={handleToggleComments}
          postId={post.id}
          reactions={post.reactions || { like: 0, heart: 0, laugh: 0, wow: 0, sad: 0 }}
          myReaction={post.my_reaction || null}
          onReact={handleReact}
          reactionsCount={post.reactions_count || 0}
          isLoading={isLoadingComments}
        />
        
        {isExpanded && (
          <CommentsSection 
            postId={post.id}
            comments={comments} 
            isLoading={isLoadingComments}
            user={user}
            currentUserId={currentUserId}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
          />
        )}
      </CardContent>
    </Card>
  );
}
