
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface TransactionSelectionControlsProps {
  selectedTransactions: string[];
  hasSelectablePending: boolean;
  isLoading: boolean;
  onSelectAllPending: () => void;
  onClearSelection: () => void;
  onConfirmSelected: () => void;
}

export function TransactionSelectionControls({
  selectedTransactions,
  hasSelectablePending,
  isLoading,
  onSelectAllPending,
  onClearSelection,
  onConfirmSelected,
}: TransactionSelectionControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAllPending}
          disabled={isLoading || !hasSelectablePending}
        >
          Selecionar Pendentes
        </Button>
        {selectedTransactions.length > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              <X className="mr-1 h-4 w-4" />
              Limpar Seleção
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onConfirmSelected}
            >
              <Check className="mr-1 h-4 w-4" />
              Confirmar Selecionados ({selectedTransactions.length})
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
