import { Transaction } from "@/types/transaction";
import { Button } from "@/components/ui/button";
import { TransactionItemRow } from "./TransactionItemRow";
import { TransactionActions } from "./TransactionActions";

interface DailyTransactionsListProps {
  days: [string, Transaction[]][];
  selectedTransactions: Set<string>;
  isLoading: boolean;
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
  selectedTransactions,
  isLoading,
  onSelectTransaction,
  onSelectAll,
  onDeselectAll,
  onEdit,
  onDelete,
  onConfirmPayment,
  onConfirmSelected,
  onDeleteSelected,
}: DailyTransactionsListProps) {
  // Verificar se há transações pendentes selecionadas em todos os dias
  const hasPendingSelected = Array.from(selectedTransactions).some((id) =>
    days
      .flatMap(([, transactions]) => transactions)
      .find((t) => t.id === id)?.payment_status === "pending"
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
    <div className="space-y-8">
      {/* Ações globais para todas as transações */}
      {selectedTransactions.size > 0 && (
        <TransactionActions
          selectedCount={selectedTransactions.size}
          hasPendingSelected={hasPendingSelected}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onConfirmSelected={onConfirmSelected}
          onDeleteSelected={onDeleteSelected}
        />
      )}

      {/* Lista completa de dias */}
      {days.map(([date, transactions]) => (
        <div key={date} className="space-y-4">
          <h3 className="text-lg font-medium text-foreground border-b pb-2">{date}</h3>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
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
            <p className="text-muted-foreground">Nenhuma transação neste dia</p>
          )}
        </div>
      ))}
    </div>
  );
}