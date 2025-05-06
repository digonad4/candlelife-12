
import { useState } from "react";
import { FileImage, FileVideo, Paperclip, Image, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MessageAttachmentProps {
  url: string;
}

export const MessageAttachment = ({ url }: MessageAttachmentProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Determine file type from URL or file extension
  const fileExtension = url.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
  const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExtension);
  
  // For the filename display
  const displayName = url.split('/').pop() || 'Anexo';

  const renderPreviewContent = () => {
    if (isImage) {
      return <img src={url} alt={displayName} className="max-w-full max-h-[80vh]" />;
    }
    
    if (isVideo) {
      return (
        <video controls className="max-w-full max-h-[80vh]">
          <source src={url} />
          Seu navegador não suporta a reprodução deste vídeo.
        </video>
      );
    }
    
    return (
      <div className="text-center p-8">
        <Paperclip className="mx-auto h-16 w-16 mb-4 text-muted-foreground" />
        <p>Este tipo de arquivo não pode ser visualizado diretamente.</p>
        <Button variant="outline" className="mt-4" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer" download={displayName}>
            Baixar arquivo
          </a>
        </Button>
      </div>
    );
  };
  
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 p-2 rounded-md border bg-background/50">
        {isImage ? (
          <Image className="h-4 w-4" />
        ) : isVideo ? (
          <FileVideo className="h-4 w-4" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
        
        <span className="text-sm truncate flex-1">{displayName}</span>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={() => setIsPreviewOpen(true)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-1 sm:p-2">
          <div className="flex justify-center items-center min-h-[200px]">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
