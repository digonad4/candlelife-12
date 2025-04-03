
import React from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isSearching: boolean;
}

export const SearchInput = ({ value, onChange, isSearching }: SearchInputProps) => {
  return (
    <div className="relative">
      <Input
        placeholder="Buscar usuários..." 
        value={value}
        onChange={onChange}
        className="pr-8"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Search className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
};
