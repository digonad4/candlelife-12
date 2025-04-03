
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Message } from "@/hooks/messages/types";

// Import our refactored components
import { ChatHeader } from "./chat/ChatHeader";
import { UserSearch } from "./chat/UserSearch";
import { ChatMessages } from "./chat/ChatMessages";
import { ChatMessageInput } from "./chat/ChatMessageInput";

type ChatModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
};

type UserSearchResult = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export function ChatModal({
  isOpen,
  onOpenChange,
  recipientId,
  recipientName,
  recipientAvatar,
}: ChatModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    sendMessage, 
    clearConversation, 
    deleteMessage 
  } = useMessages();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Buscar mensagens da conversa
  const { 
    data: conversation, 
    isLoading, 
    isError, 
    refetch 
  } = useMessages().getConversation(recipientId);
  
  // Refetch messages when modal opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Search for users
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${query}%`)
        .limit(5);

      if (error) throw error;

      // Filter out current user
      const filteredData = data.filter(profile => profile.id !== user?.id);
      setSearchResults(filteredData);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      await sendMessage.mutateAsync({
        recipientId,
        content: message.trim()
      });
      setMessage("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectUser = (selectedUser: UserSearchResult) => {
    onOpenChange(false);
    // This will close the current chat and then open a new one with the selected user
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-chat', { 
        detail: { 
          userId: selectedUser.id, 
          userName: selectedUser.username, 
          userAvatar: selectedUser.avatar_url 
        } 
      }));
    }, 100);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleClearConversation = async () => {
    if (!recipientId || !user) return;
    
    try {
      await clearConversation.mutateAsync(recipientId);
      setIsClearDialogOpen(false);
    } catch (error) {
      console.error("Erro ao limpar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar a conversa. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessageId || !user) return;
    
    try {
      await deleteMessage.mutateAsync(selectedMessageId);
      setIsDeleteDialogOpen(false);
      setSelectedMessageId(null);
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a mensagem. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md h-[500px] flex flex-col p-0">
          <ChatHeader 
            recipientName={recipientName}
            recipientAvatar={recipientAvatar}
            onSearchClick={() => setIsSearchOpen(true)}
            onClearChat={() => setIsClearDialogOpen(true)}
          />
          
          <UserSearch 
            isOpen={isSearchOpen}
            onOpenChange={setIsSearchOpen}
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            isSearching={isSearching}
            searchResults={searchResults}
            onSelectUser={handleSelectUser}
            trigger={<div />} // Empty div as we're controlling open state
          />
          
          <ChatMessages 
            messages={conversation || []}
            isLoading={isLoading}
            isError={isError}
            currentUserId={user?.id}
            onDeleteMessage={(messageId) => {
              setSelectedMessageId(messageId);
              setIsDeleteDialogOpen(true);
            }}
          />
          
          <ChatMessageInput 
            message={message}
            onMessageChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            onSendMessage={handleSendMessage}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação para limpar conversa */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar todas as mensagens desta conversa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearConversation} className="bg-destructive">
              Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de confirmação para excluir mensagem */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mensagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
