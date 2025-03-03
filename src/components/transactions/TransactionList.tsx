
import { Transaction } from "@/types/transaction";
import { TransactionItem } from "./TransactionItem";
import { Button } from "@/components/ui/button";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  selectedTransactions: string[];
  onSelectTransaction: (id: string, isPending: boolean) => void;
  onOpenConfirmDialog: (ids: string[]) => void;
}

export function TransactionList({
  transactions,
  isLoading,
  selectedTransactions,
  onSelectTransaction,
  onOpenConfirmDialog,
}: TransactionListProps) {
  if (isLoading) {
    return <p className="text-muted-foreground dark:text-gray-400">Carregando...</p>;
  }

  if (transactions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 dark:text-gray-400">
        Nenhuma transação para o período selecionado.
      </p>
    );
  }

  return (
    <>
      {selectedTransactions.length > 0 && (
        <Button
          onClick={() => onOpenConfirmDialog(selectedTransactions)}
          className="mb-4 bg-green-600 hover:bg-green-700 text-sm py-1 px-3 dark:bg-green-500 dark:hover:bg-green-600"
        >
          Confirmar {selectedTransactions.length} Pagamento(s)
        </Button>
      )}
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            selectedTransactions={selectedTransactions}
            onSelectTransaction={onSelectTransaction}
            onOpenConfirmDialog={onOpenConfirmDialog}
          />
        ))}
      </div>
    </>
  );
}
