
import { SocialHeader } from "@/components/social/SocialHeader";
import { FeedContent } from "@/components/social/FeedContent";
import { PostEditor } from "@/components/social/PostEditor"; 
import { BackButton } from "@/components/navigation/BackButton";

const Social = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <BackButton />
      <SocialHeader />
      <PostEditor />
      <FeedContent />
    </div>
  );
};

export default Social;
