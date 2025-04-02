
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UserIcon } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { PostEditorForm } from "./post/PostEditorForm";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createPost, updatePost, isUploading } = usePosts();
  
  const isEditing = !!editingPost;

  const handleSubmit = async ({ content, imageFile, keepImage }: { 
    content: string; 
    imageFile: File | null; 
    keepImage: boolean;
  }) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing && editingPost) {
        await updatePost.mutateAsync({
          id: editingPost.id,
          content,
          imageFile: imageFile || undefined,
          keepExistingImage: !imageFile && keepImage
        });
        if (onCancelEdit) onCancelEdit();
      } else {
        await createPost.mutateAsync({
          content,
          imageFile: imageFile || undefined
        });
      }
    } catch (error) {
      console.error("Erro ao salvar post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          
          <PostEditorForm
            initialContent={editingPost?.content || ""}
            initialImageUrl={editingPost?.image_url || null}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            isUploading={isUploading}
            onSubmit={handleSubmit}
            onCancel={onCancelEdit}
          />
        </div>
      </CardContent>
    </Card>
  );
}
