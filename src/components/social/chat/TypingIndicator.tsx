
import { Loader2 } from "lucide-react";

interface TypingIndicatorProps {
  isTyping: boolean;
  username: string;
}

export const TypingIndicator = ({ isTyping, username }: TypingIndicatorProps) => {
  if (!isTyping) return null;
  
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground ml-10 mt-1 mb-2">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>{username} está digitando...</span>
    </div>
  );
};
