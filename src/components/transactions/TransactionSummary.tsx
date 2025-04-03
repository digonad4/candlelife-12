
import { Card, CardContent } from "@/components/ui/card";

interface TransactionSummaryProps {
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export function TransactionSummary({
  totalTransactions,
  totalIncome,
  totalExpenses,
  balance,
}: TransactionSummaryProps) {
  return (
    <Card className="mb-6 bg-card">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total de Transações</p>
            <p className="text-2xl font-bold text-foreground">{totalTransactions}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Receitas</p>
            <p className="text-2xl font-bold text-green-600">
              {totalIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Despesas</p>
            <p className="text-2xl font-bold text-red-600">
              {totalExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
