
import { Transaction } from "@/types/transaction";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionItemRow } from "./TransactionItemRow";
import { TransactionActions } from "./TransactionActions";

interface DailyTransactionsListProps {
  days: [string, Transaction[]][];
  currentDayIndex: number;
  selectedTransactions: Set<string>;
  isLoading: boolean;
  onPageChange: (index: number) => void;
  onSelectTransaction: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onConfirmPayment: (transaction: Transaction) => void;
  onConfirmSelected: () => void;
  onDeleteSelected: () => void;
}

export function DailyTransactionsList({
  days,
  currentDayIndex,
  selectedTransactions,
  isLoading,
  onPageChange,
  onSelectTransaction,
  onSelectAll,
  onDeselectAll,
  onEdit,
  onDelete,
  onConfirmPayment,
  onConfirmSelected,
  onDeleteSelected
}: DailyTransactionsListProps) {
  const currentDay = days[currentDayIndex] || [];
  const currentTransactions = currentDay[1] || [];
  
  const hasPendingSelected = Array.from(selectedTransactions).some(id => 
    currentTransactions.find(t => t.id === id)?.payment_status === "pending"
  );

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  if (days.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhuma transação encontrada
      </p>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{currentDay[0]}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.max(0, currentDayIndex - 1))}
            disabled={currentDayIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentDayIndex + 1} de {days.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.min(days.length - 1, currentDayIndex + 1))}
            disabled={currentDayIndex === days.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {currentTransactions.length > 0 && (
        <TransactionActions
          selectedCount={selectedTransactions.size}
          hasPendingSelected={hasPendingSelected}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onConfirmSelected={onConfirmSelected}
          onDeleteSelected={onDeleteSelected}
        />
      )}

      {currentTransactions.length > 0 ? (
        <div className="space-y-4">
          {currentTransactions.map((transaction) => (
            <TransactionItemRow
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedTransactions.has(transaction.id)}
              onSelect={onSelectTransaction}
              onEdit={onEdit}
              onDelete={onDelete}
              onConfirmPayment={onConfirmPayment}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Nenhuma transação encontrada para este dia
        </p>
      )}
    </>
  );
}
