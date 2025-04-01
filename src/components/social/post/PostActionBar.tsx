
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share } from "lucide-react";

type PostActionBarProps = {
  commentsCount: number;
  onToggleComments: () => void;
};

export function PostActionBar({ commentsCount, onToggleComments }: PostActionBarProps) {
  return (
    <div className="flex justify-between items-center w-full border-t border-b py-2 mb-3">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex gap-1 items-center"
      >
        <Heart className="h-5 w-5" />
        <span>0</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex gap-1 items-center"
        onClick={onToggleComments}
      >
        <MessageCircle className="h-5 w-5" />
        <span>{commentsCount || 0}</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex gap-1 items-center"
      >
        <Share className="h-5 w-5" />
      </Button>
    </div>
  );
}
