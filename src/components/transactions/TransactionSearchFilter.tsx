
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LayoutList, Table } from "lucide-react";

interface TransactionSearchFilterProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  viewMode: "list" | "table";
  onToggleViewMode: () => void;
}

export function TransactionSearchFilter({
  searchTerm,
  onSearchTermChange,
  viewMode,
  onToggleViewMode,
}: TransactionSearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
      <div className="relative w-full sm:w-1/2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar transações..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button variant="outline" onClick={onToggleViewMode} className="w-full sm:w-auto">
        {viewMode === "list" ? (
          <>
            <Table className="mr-2 h-4 w-4" />
            Ver como Tabela
          </>
        ) : (
          <>
            <LayoutList className="mr-2 h-4 w-4" />
            Ver como Lista
          </>
        )}
      </Button>
    </div>
  );
}
