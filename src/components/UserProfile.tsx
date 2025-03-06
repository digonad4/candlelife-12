
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserRound } from "lucide-react";

export const UserProfile = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error loading profile:", error);
        return;
      }
      
      if (data) {
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (!username) return "U";
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className="border border-border">
        <AvatarImage src={avatarUrl || undefined} alt={username} />
        <AvatarFallback>
          {isLoading ? <span className="animate-pulse">...</span> : <UserRound className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        <p className="font-medium text-sm">{username || 'Usuário'}</p>
      </div>
    </div>
  );
};
