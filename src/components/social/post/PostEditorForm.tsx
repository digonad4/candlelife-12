
import React, { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ImagePreview } from "./ImagePreview";
import { PostEditorActions } from "./PostEditorActions";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type PostEditorFormProps = {
  initialContent: string;
  initialImageUrl: string | null;
  isEditing: boolean;
  isSubmitting: boolean;
  isUploading: boolean;
  onSubmit: (data: { content: string; imageFile: File | null; keepImage: boolean }) => Promise<void>;
  onCancel?: () => void;
};

export function PostEditorForm({
  initialContent,
  initialImageUrl,
  isEditing,
  isSubmitting,
  isUploading,
  onSubmit,
  onCancel
}: PostEditorFormProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl);
  const [keepImage, setKeepImage] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    await onSubmit({
      content: content.trim(),
      imageFile: selectedImage,
      keepImage
    });
    
    if (!isEditing) {
      setContent("");
      setSelectedImage(null);
      setImagePreview(null);
    }
  };
  
  const isLoading = isSubmitting || isUploading;
  const hasContent = !!content.trim();
  const hasImage = !!selectedImage || (isEditing && keepImage && !!imagePreview);

  return (
    <div className="flex-1">
      <Textarea
        placeholder={isEditing ? "Edite sua publicação..." : "No que você está pensando?"}
        className="resize-none mb-3"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      
      {imagePreview && (
        <ImagePreview 
          imageUrl={imagePreview} 
          onRemove={removeImage} 
        />
      )}
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        ref={fileInputRef}
        title="Selecione uma imagem para upload"
      />
      
      <PostEditorActions 
        isEditing={isEditing}
        isLoading={isLoading}
        hasContent={hasContent}
        hasImage={hasImage}
        fileInputRef={fileInputRef}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        imagePreview={imagePreview}
      />
    </div>
  );
}
