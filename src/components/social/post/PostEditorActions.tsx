
import React, { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Loader2 } from "lucide-react";

type PostEditorActionsProps = {
  isEditing: boolean;
  isLoading: boolean;
  hasContent: boolean;
  hasImage: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onSubmit: () => void;
  onCancel?: () => void;
  imagePreview: string | null;
};

export function PostEditorActions({ 
  isEditing, 
  isLoading, 
  hasContent, 
  hasImage,
  fileInputRef, 
  onSubmit, 
  onCancel,
  imagePreview
}: PostEditorActionsProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
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
        {isEditing && onCancel && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        <Button 
          size="sm" 
          onClick={onSubmit} 
          disabled={isLoading || (!hasContent && !hasImage)}
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
  );
}
