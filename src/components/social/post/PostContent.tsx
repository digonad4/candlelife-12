
import { useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type PostContentProps = {
  content: string;
  imageUrl: string | null;
};

export function PostContent({ content, imageUrl }: PostContentProps) {
  // Trata conteúdo potencialmente nulo com fallback seguro
  const safeContent = useMemo(() => {
    return typeof content === 'string' ? content : '';
  }, [content]);

  // Verifica se a URL da imagem é válida
  const isValidImageUrl = useMemo(() => {
    return imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0;
  }, [imageUrl]);

  // Trata erros de carregamento de imagem
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    
    // Adiciona um elemento para mostrar erro
    const errorElement = document.createElement('div');
    errorElement.className = "mt-2 text-sm text-destructive";
    errorElement.textContent = "Erro ao carregar imagem";
    e.currentTarget.parentNode?.appendChild(errorElement);
  };

  return (
    <div>
      {safeContent ? (
        <p className="whitespace-pre-line">{safeContent}</p>
      ) : (
        <Alert variant="destructive" className="mb-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Conteúdo não disponível
          </AlertDescription>
        </Alert>
      )}
      
      {isValidImageUrl && (
        <div className="mt-3">
          <img 
            src={imageUrl} 
            alt="Imagem do post" 
            className="rounded-md max-h-96 object-cover" 
            onError={handleImageError}
          />
        </div>
      )}
    </div>
  );
}
