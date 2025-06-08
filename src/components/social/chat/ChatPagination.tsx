
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ChatPaginationProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  totalCount: number;
  visibleCount: number;
}

export const ChatPagination = ({
  hasMore,
  isLoading,
  onLoadMore,
  totalCount,
  visibleCount
}: ChatPaginationProps) => {
  if (!hasMore) return null;
  
  return (
    <div className="flex justify-center mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onLoadMore}
        disabled={isLoading || !hasMore}
        className="text-xs gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Carregando...
          </>
        ) : (
          <>
            Carregar mensagens anteriores 
            {totalCount > 0 ? ` (${visibleCount}/${totalCount})` : ""}
          </>
        )}
      </Button>
    </div>
  );
};
