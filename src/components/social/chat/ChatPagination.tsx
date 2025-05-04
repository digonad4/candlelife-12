
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

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
    <div className="flex justify-center my-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={onLoadMore}
        disabled={isLoading}
        className="flex items-center gap-1 text-xs"
      >
        {isLoading ? (
          <Spinner className="h-3 w-3 mr-1" />
        ) : (
          <ChevronUp className="h-3 w-3 mr-1" />
        )}
        Carregar mensagens anteriores 
        {totalCount > 0 && (
          <span className="text-muted-foreground ml-1">
            ({visibleCount} de {totalCount})
          </span>
        )}
      </Button>
    </div>
  );
};
