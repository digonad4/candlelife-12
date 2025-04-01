
import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, X, Loader2, UserIcon } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";

type PostEditorProps = {
  editingPost?: {
    id: string;
    content: string;
    image_url: string | null;
  } | null;
  onCancelEdit?: () => void;
};

export function PostEditor({ editingPost, onCancelEdit }: PostEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState(editingPost?.content || "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editingPost?.image_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keepImage, setKeepImage] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createPost, updatePost, isUploading } = usePosts();
  
  const isEditing = !!editingPost;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter menos de 5MB",
        variant: "destructive",
      });
      return;
    }
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "O arquivo selecionado não é uma imagem",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedImage(file);
    setKeepImage(true);
    
    // Criar URL temporária para preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setKeepImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleSubmit = async () => {
    if (!content.trim() && !selectedImage && !(isEditing && keepImage && imagePreview)) {
      toast({
        title: "Erro",
        description: "Adicione um texto ou imagem para publicar",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && editingPost) {
        await updatePost.mutateAsync({
          id: editingPost.id,
          content: content.trim(),
          imageFile: selectedImage || undefined,
          keepExistingImage: !selectedImage && keepImage
        });
        if (onCancelEdit) onCancelEdit();
      } else {
        await createPost.mutateAsync({
          content: content.trim(),
          imageFile: selectedImage || undefined
        });
        setContent("");
        setSelectedImage(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error("Erro ao salvar post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = isSubmitting || isUploading;

  return (
    <Card className="border-border mb-6">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            {user?.user_metadata?.avatar_url ? (
              <AvatarImage src={user.user_metadata.avatar_url} />
            ) : (
              <AvatarFallback>
                {user?.user_metadata?.username && user.user_metadata.username.length > 0
                  ? user.user_metadata.username[0].toUpperCase()
                  : <UserIcon className="h-4 w-4" />}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder={isEditing ? "Edite sua publicação..." : "No que você está pensando?"}
              className="resize-none mb-3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            
            {imagePreview && (
              <div className="relative mb-3 inline-block">
                <img 
                  src={imagePreview} 
                  alt="Pré-visualização" 
                  className="max-h-60 rounded-md object-cover"
                />
                <Button 
                  size="icon" 
                  variant="destructive" 
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {imagePreview ? "Trocar imagem" : "Adicionar imagem"}
                </Button>
              </div>
              
              <div className="flex gap-2">
                {isEditing && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onCancelEdit}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={handleSubmit} 
                  disabled={isLoading || (!content.trim() && !selectedImage && !(isEditing && keepImage && imagePreview))}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEditing ? "Salvando..." : "Publicando..."}
                    </>
                  ) : (
                    isEditing ? "Salvar" : "Publicar"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
