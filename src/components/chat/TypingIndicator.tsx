
interface TypingIndicatorProps {
  isTyping: boolean;
  username: string;
}

export const TypingIndicator = ({ isTyping, username }: TypingIndicatorProps) => {
  if (!isTyping) return null;

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground italic">
      {username} está digitando...
    </div>
  );
};
