
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

type PostContentProps = {
  content: string;
  imageUrl: string | null;
};

export function PostContent({ content, imageUrl }: PostContentProps) {
  // Função para converter URLs em links clicáveis
  const formatTextWithLinks = (text: string): ReactNode[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    const parts = text.split(urlRegex);
    const result: ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Texto normal
        result.push(<span key={i}>{parts[i]}</span>);
      } else {
        // URL
        result.push(
          <a 
            key={i} 
            href={parts[i]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {parts[i]}
          </a>
        );
      }
    }
    
    return result;
  };

  return (
    <div className="space-y-3">
      {content && content.length > 0 && (
        <div className="whitespace-pre-wrap break-words">
          {formatTextWithLinks(content)}
        </div>
      )}
      
      {imageUrl && (
        <a 
          href={imageUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <img 
            src={imageUrl} 
            alt="Imagem da publicação" 
            className="rounded-md max-h-96 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
              e.currentTarget.alt = 'Imagem indisponível';
            }}
          />
        </a>
      )}
    </div>
  );
}

export function PostContentSkeleton() {
  return (
    <Card className="space-y-2 p-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-40 w-full" />
    </Card>
  );
}
