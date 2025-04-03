
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, ThumbsUp, Smile, Frown, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ReactionBarProps {
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
}

export const ReactionBar = ({ postId, reactions, myReaction, onReact, reactionsCount }: ReactionBarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const reactionIcons = {
    like: { icon: ThumbsUp, label: "Curtir", color: "text-blue-500" },
    heart: { icon: Heart, label: "Amei", color: "text-rose-500" },
    laugh: { icon: Smile, label: "Haha", color: "text-yellow-500" },
    wow: { icon: Award, label: "Uau", color: "text-purple-500" },
    sad: { icon: Frown, label: "Triste", color: "text-gray-500" },
  };
  
  // Determine o ícone ativo com base na reação atual do usuário
  const activeReaction = myReaction ? reactionIcons[myReaction as keyof typeof reactionIcons] : null;
  
  const handleReact = (type: 'like' | 'heart' | 'laugh' | 'wow' | 'sad') => {
    // Se o usuário já reagiu com este tipo, então estamos removendo a reação
    // ou se ele reagiu com outro tipo, estamos mudando a reação
    onReact(type);
    setIsOpen(false);
  };
  
  // Calcular qual reação tem o maior número para mostrar como ícone principal
  let primaryReaction = 'like';
  let maxCount = -1;
  
  Object.entries(reactions).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      primaryReaction = type as keyof typeof reactionIcons;
    }
  });
  
  // Se não houver reações, usar "like" como padrão
  const PrimaryIcon = maxCount > 0 
    ? reactionIcons[primaryReaction].icon 
    : ThumbsUp;

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider delayDuration={300}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "flex items-center gap-1.5 text-sm", 
                myReaction && activeReaction?.color
              )}
              onClick={() => myReaction ? onReact(myReaction as 'like') : setIsOpen(true)}
            >
              {activeReaction ? (
                <activeReaction.icon className="h-4 w-4" />
              ) : (
                <PrimaryIcon className="h-4 w-4" />
              )}
              <span>
                {myReaction 
                  ? activeReaction?.label 
                  : reactionsCount > 0 ? `${reactionsCount}` : "Reagir"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 flex gap-1" align="start">
            {Object.entries(reactionIcons).map(([type, { icon: Icon, label, color }]) => (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("rounded-full hover:scale-125 transition-transform", color)}
                    onClick={() => handleReact(type as 'like' | 'heart' | 'laugh' | 'wow' | 'sad')}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </PopoverContent>
        </Popover>
      </TooltipProvider>
      
      {reactionsCount > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <div className="flex -space-x-1 overflow-hidden">
            {Object.entries(reactions).map(([type, count]) => {
              if (count > 0) {
                const { icon: Icon, color } = reactionIcons[type as keyof typeof reactionIcons];
                return (
                  <div 
                    key={type} 
                    className={cn("h-4 w-4 rounded-full bg-background flex items-center justify-center", color)}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                );
              }
              return null;
            })}
          </div>
          <span>{reactionsCount}</span>
        </div>
      )}
    </div>
  );
};
