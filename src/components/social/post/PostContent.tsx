
type PostContentProps = {
  content: string;
  imageUrl: string | null;
};

export function PostContent({ content, imageUrl }: PostContentProps) {
  return (
    <div>
      <p className="whitespace-pre-line">{content}</p>
      
      {imageUrl && (
        <div className="mt-3">
          <img 
            src={imageUrl} 
            alt="Imagem do post" 
            className="rounded-md max-h-96 object-cover" 
          />
        </div>
      )}
    </div>
  );
}
