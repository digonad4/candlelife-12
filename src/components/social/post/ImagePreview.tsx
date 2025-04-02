
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type ImagePreviewProps = {
  imageUrl: string;
  onRemove: () => void;
};

export function ImagePreview({ imageUrl, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative mb-3 inline-block">
      <img 
        src={imageUrl} 
        alt="Pré-visualização" 
        className="max-h-60 rounded-md object-cover"
      />
      <Button 
        size="icon" 
        variant="destructive" 
        className="absolute top-2 right-2 h-6 w-6 rounded-full"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
