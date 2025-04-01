
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, UserIcon } from "lucide-react";
import { User } from "@supabase/supabase-js";

type CommentFormProps = {
  user: User | null;
  isSubmitting: boolean;
  onSubmit: (content: string) => void;
};

export function CommentForm({ user, isSubmitting, onSubmit }: CommentFormProps) {
  const [content, setContent] = useState("");
  
  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content);
    setContent("");
  };

  return (
    <div className="flex gap-2 mt-4">
      <Avatar className="h-8 w-8">
        {user?.user_metadata?.avatar_url ? (
          <AvatarImage src={user.user_metadata.avatar_url} />
        ) : (
          <AvatarFallback>
            {user?.user_metadata?.username 
              ? user.user_metadata.username[0].toUpperCase() 
              : <UserIcon className="h-4 w-4" />}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 flex gap-2">
        <Input
          placeholder="Escreva um comentário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1"
        />
        <Button 
          size="icon" 
          onClick={handleSubmit} 
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
