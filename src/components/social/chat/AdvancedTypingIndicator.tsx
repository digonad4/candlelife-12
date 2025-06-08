
interface AdvancedTypingIndicatorProps {
  isTyping: boolean;
  username: string;
}

export const AdvancedTypingIndicator = ({ isTyping, username }: AdvancedTypingIndicatorProps) => {
  if (!isTyping) return null;

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>{username} está digitando...</span>
      </div>
    </div>
  );
};
