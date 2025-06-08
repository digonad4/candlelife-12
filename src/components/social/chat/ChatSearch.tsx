
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface ChatSearchProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export const ChatSearch = ({ onSearch, isSearching }: ChatSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearch("");
    setIsSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      clearSearch();
    }
  };

  if (!isSearchOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsSearchOpen(true)}
        title="Pesquisar mensagens"
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 w-full max-w-[220px]">
      <Input
        placeholder="Pesquisar mensagens"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8 text-sm w-full"
        autoFocus
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSearch}
          className="h-8 w-8"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSearch}
        className="h-8 w-8"
        disabled={isSearching || !searchQuery.trim()}
      >
        <Search className="h-3 w-3" />
      </Button>
    </div>
  );
};
