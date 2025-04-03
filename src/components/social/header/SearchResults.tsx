
import React from "react";
import { SearchUserItem } from "./SearchUserItem";

type UserSearchResult = {
  id: string;
  username: string;
  avatar_url: string | null;
};

interface SearchResultsProps {
  searchResults: UserSearchResult[];
  searchQuery: string;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
}

export const SearchResults = ({ 
  searchResults, 
  searchQuery,
  onSelectUser 
}: SearchResultsProps) => {
  if (searchResults.length === 0 && searchQuery.trim().length > 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum usuário encontrado com "{searchQuery}"
      </div>
    );
  }
  
  if (searchResults.length === 0) {
    return null;
  }
  
  return (
    <div className="border rounded-md shadow-sm p-2 space-y-1">
      <p className="text-xs text-muted-foreground mb-2">Resultados da busca</p>
      {searchResults.map((result) => (
        <SearchUserItem
          key={result.id}
          id={result.id}
          username={result.username}
          avatar_url={result.avatar_url}
          onClick={() => onSelectUser(result.id, result.username, result.avatar_url || undefined)}
        />
      ))}
    </div>
  );
};
