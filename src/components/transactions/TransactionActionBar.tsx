
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/transaction";

interface TransactionActionBarProps {
  selectedTransactions: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onConfirmSelected: () => void;
  onDeleteSelected: () => void;
}

export function TransactionActionBar({ 
  selectedTransactions,
  onSelectAll,
  onDeselectAll,
  onConfirmSelected,
  onDeleteSelected
}: TransactionActionBarProps) {
  return (
    <div className="flex flex-wrap gap-2 my-4">
      <Button variant="outline" size="sm" onClick={onSelectAll}>
        Selecionar Todos
      </Button>
      
      {selectedTransactions.size > 0 && (
        <>
          <Button variant="outline" size="sm" onClick={onDeselectAll}>
            Limpar Seleção ({selectedTransactions.size})
          </Button>
          <Button variant="default" size="sm" onClick={onConfirmSelected}>
            Confirmar Selecionados
          </Button>
          <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
            Excluir Selecionados
          </Button>
        </>
      )}
    </div>
  );
}
