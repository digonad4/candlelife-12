
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Loader2, 
  UserIcon, 
  Search, 
  Trash2, 
  MoreVertical,
  X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";

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
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Buscar mensagens da conversa
  const { 
    data: conversation, 
    isLoading, 
    isError, 
    refetch 
  } = useMessages().getConversation(recipientId);
  
  // Sempre rolar para a mensagem mais recente
  useEffect(() => {
    if (isOpen && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, conversation]);
  
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
      
      // Aguardar um momento e fazer scroll para a mensagem mais recente
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
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
  
  const formatMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
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
          <DialogHeader className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar>
                {recipientAvatar ? (
                  <AvatarImage src={recipientAvatar} />
                ) : (
                  <AvatarFallback>
                    {recipientName && recipientName.length > 0 
                      ? recipientName[0].toUpperCase() 
                      : <UserIcon className="h-4 w-4" />}
                  </AvatarFallback>
                )}
              </Avatar>
              <DialogTitle>{recipientName}</DialogTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Buscar usuários</h3>
                    <Input
                      placeholder="Digite um nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                    
                    <div className="max-h-48 overflow-y-auto mt-2">
                      {isSearching ? (
                        <div className="flex justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-1">
                          {searchResults.map((user) => (
                            <Button
                              key={user.id}
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleSelectUser(user)}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  {user.avatar_url ? (
                                    <AvatarImage src={user.avatar_url} />
                                  ) : (
                                    <AvatarFallback>
                                      {user.username[0].toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="truncate">{user.username}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      ) : searchQuery.trim().length > 0 ? (
                        <p className="text-sm text-muted-foreground py-2 text-center">
                          Nenhum usuário encontrado
                        </p>
                      ) : null}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setIsClearDialogOpen(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar conversa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-destructive">
                Não foi possível carregar as mensagens.
              </div>
            ) : conversation && conversation.length > 0 ? (
              <>
                {conversation.map((msg: Message) => {
                  const isSentByMe = msg.sender_id === user?.id;
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`mb-4 flex ${isSentByMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-start gap-2 max-w-[80%]">
                        {!isSentByMe && (
                          <Avatar className="h-8 w-8">
                            {msg.sender_profile?.avatar_url ? (
                              <AvatarImage src={msg.sender_profile.avatar_url} />
                            ) : (
                              <AvatarFallback>
                                {msg.sender_profile?.username && msg.sender_profile.username.length > 0
                                  ? msg.sender_profile.username[0].toUpperCase()
                                  : <UserIcon className="h-4 w-4" />}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        )}
                        
                        <div className="relative group">
                          <div 
                            className={`p-3 rounded-lg ${
                              isSentByMe 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatMessageTime(msg.created_at)}
                          </p>
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 absolute top-0 -right-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setSelectedMessageId(msg.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma mensagem ainda. Diga olá!
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t mt-auto">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
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
