
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

type PostActionBarProps = {
  commentsCount: number;
  onToggleComments: () => void;
};

export function PostActionBar({ commentsCount, onToggleComments }: PostActionBarProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  
  const handleLikeClick = () => {
    if (liked) {
      setLikeCount(prev => Math.max(0, prev - 1));
      setLiked(false);
    } else {
      setLikeCount(prev => prev + 1);
      setLiked(true);
    }
  };
  
  const handleShare = () => {
    // Implementação futura
    alert("Função de compartilhamento será implementada em breve!");
  };

  return (
    <div className="flex justify-between items-center w-full border-t border-b py-2 mb-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex gap-1 items-center ${liked ? 'text-red-500' : ''}`}
              onClick={handleLikeClick}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Curtir</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex gap-1 items-center"
              onClick={onToggleComments}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{commentsCount || 0}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver comentários</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex gap-1 items-center"
              onClick={handleShare}
            >
              <Share className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Compartilhar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
