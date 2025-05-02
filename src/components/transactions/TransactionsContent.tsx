
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyTransactionsList } from "@/components/transactions/DailyTransactionsList";
import { TransactionActionBar } from "@/components/transactions/TransactionActionBar";
import { Transaction } from "@/types/transaction";

interface TransactionsContentProps {
  days: [string, Transaction[]][];
  isLoading: boolean;
  selectedTransactions: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function TransactionsContent({
  days,
  isLoading,
  selectedTransactions,
  onToggleSelection,
  onSelectAll,
  onDeselectAll
}: TransactionsContentProps) {
  return (
    <Card className="rounded-xl border-border bg-card w-full">
      <CardHeader>
        <CardTitle className="text-card-foreground">
          Histórico de Transações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionActionBar
          selectedTransactions={selectedTransactions}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onConfirmSelected={() => {}}
          onDeleteSelected={() => {}}
        />
        
        {isLoading ? (
          <p className="text-center text-muted-foreground">Carregando...</p>
        ) : days.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma transação encontrada para o período selecionado.</p>
        ) : (
          <DailyTransactionsList
            days={days}
            selectedTransactions={selectedTransactions}
            isLoading={isLoading}
            onSelectTransaction={onToggleSelection}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            onEdit={() => {}}
            onDelete={() => {}}
            onConfirmPayment={() => {}}
            onConfirmSelected={() => {}}
            onDeleteSelected={() => {}}
          />
        )}
      </CardContent>
    </Card>
  );
}
