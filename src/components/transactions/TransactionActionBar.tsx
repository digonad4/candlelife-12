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
  const hasSelected = selectedTransactions.size > 0;
  return <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg px-0 py-0 my-0 mx-0">
      <div className="flex items-center gap-2 flex-1">
        <Button variant="outline" size="sm" onClick={onSelectAll} className="py-0 my-0">
          Selecionar Todos
        </Button>
        
        <Button variant="outline" size="sm" onClick={onDeselectAll} disabled={!hasSelected}>
          Limpar Seleção
        </Button>

        {hasSelected && <span className="text-sm text-muted-foreground">
            {selectedTransactions.size} selecionada(s)
          </span>}
      </div>

      {hasSelected && <div className="flex items-center gap-2">
          <Button size="sm" onClick={onConfirmSelected}>
            Confirmar Selecionadas
          </Button>
          
          <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
            Excluir Selecionadas
          </Button>
        </div>}
    </div>;
}