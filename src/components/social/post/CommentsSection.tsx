
import { useState } from "react";
import { Comment } from "@/hooks/usePosts";
import { User } from "@supabase/supabase-js";
import { CommentsList } from "./CommentsList";
import { CommentForm } from "./CommentForm";

type CommentsSectionProps = {
  postId: string;
  comments: Comment[];
  isLoading: boolean;
  user: User | null;
  currentUserId?: string;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
};

export function CommentsSection({ 
  postId,
  comments, 
  isLoading, 
  user,
  currentUserId,
  onAddComment,
  onDeleteComment
}: CommentsSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddComment = async (content: string) => {
    setIsSubmitting(true);
    try {
      await onAddComment(content);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <CommentsList 
        comments={comments} 
        isLoading={isLoading}
        currentUserId={currentUserId}
        onDeleteComment={onDeleteComment}
      />
      
      <CommentForm 
        user={user} 
        isSubmitting={isSubmitting}
        onSubmit={handleAddComment}
      />
    </div>
  );
}
