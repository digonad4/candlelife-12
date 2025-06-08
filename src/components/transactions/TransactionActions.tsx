
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Square, CheckSquare } from "lucide-react";

interface TransactionActionsProps {
  selectedCount: number;
  hasPendingSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onConfirmSelected: () => void;
  onDeleteSelected: () => void;
}

export function TransactionActions({
  selectedCount,
  hasPendingSelected,
  onSelectAll,
  onDeselectAll,
  onConfirmSelected,
  onDeleteSelected
}: TransactionActionsProps) {
  return (
    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
      <span className="text-sm font-medium">
        {selectedCount} selecionada{selectedCount > 1 ? 's' : ''}
      </span>
      
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
        >
          <CheckSquare className="h-4 w-4 mr-1" />
          Selecionar todas
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onDeselectAll}
        >
          <Square className="h-4 w-4 mr-1" />
          Desmarcar todas
        </Button>
        
        {hasPendingSelected && (
          <Button
            variant="default"
            size="sm"
            onClick={onConfirmSelected}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Confirmar pagamento
          </Button>
        )}
        
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      </div>
    </div>
  );
}
