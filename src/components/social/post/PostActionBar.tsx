
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { ReactionBar } from "./ReactionBar";

interface PostActionBarProps {
  commentsCount: number;
  onToggleComments: () => void;
  postId: string;
  reactions: {
    like: number;
    heart: number;
    laugh: number;
    wow: number;
    sad: number;
  };
  myReaction: string | null;
  onReact: (type: 'like' | 'heart' | 'laugh' | 'wow' | 'sad') => void;
  reactionsCount: number;
  isLoading?: boolean;
}

export function PostActionBar({ 
  commentsCount, 
  onToggleComments, 
  postId,
  reactions,
  myReaction,
  onReact,
  reactionsCount,
  isLoading 
}: PostActionBarProps) {
  return (
    <div className="flex justify-between items-center">
      <ReactionBar 
        postId={postId}
        reactions={reactions}
        myReaction={myReaction}
        onReact={onReact}
        reactionsCount={reactionsCount}
      />
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-1.5 text-sm" 
        onClick={onToggleComments}
        disabled={isLoading}
      >
        <MessageSquare className="h-4 w-4" />
        <span>{commentsCount > 0 ? `${commentsCount} comentários` : "Comentar"}</span>
      </Button>
    </div>
  );
}
