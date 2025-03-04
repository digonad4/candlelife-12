
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2 } from "lucide-react";

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
    <div className="mb-6 flex gap-2 flex-wrap">
      <Button 
        size="sm"
        onClick={onSelectAll}
        className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Selecionar
      </Button>
      <Button 
        size="sm"
        onClick={onDeselectAll}
        variant="outline"
        className="border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <Trash2 className="w-3 h-3 mr-1" />
        Limpar
      </Button>
      {selectedCount > 0 && (
        <>
          <Button 
            size="sm"
            onClick={onConfirmSelected}
            disabled={!hasPendingSelected}
            className="bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmar ({selectedCount})
          </Button>
          <Button 
            size="sm"
            onClick={onDeleteSelected}
            className="bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Excluir ({selectedCount})
          </Button>
        </>
      )}
    </div>
  );
}
