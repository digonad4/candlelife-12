
import { SocialHeader } from "@/components/social/SocialHeader";
import { FeedContent } from "@/components/social/FeedContent";
import { PostEditor } from "@/components/social/PostEditor"; 
import { BackButton } from "@/components/navigation/BackButton";
import { useOutletContext } from "react-router-dom";
import { usePosts } from "@/hooks/usePosts";
import { useState } from "react";

const Social = () => {
  const { openChat } = useOutletContext<{ openChat: (userId: string, userName: string, userAvatar?: string) => void }>();
  const [editingPost, setEditingPost] = useState(null);
  const { data: posts = [], isLoading: isLoadingPosts } = usePosts();

  const handleEdit = (post: any) => {
    setEditingPost(post);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <BackButton />
      <SocialHeader openChat={openChat} />
      <PostEditor />
      <FeedContent 
        posts={posts} 
        isLoadingPosts={isLoadingPosts}
        editingPost={editingPost}
        onEdit={handleEdit}
        onCancelEdit={handleCancelEdit}
        openChat={openChat}
      />
    </div>
  );
};

export default Social;
