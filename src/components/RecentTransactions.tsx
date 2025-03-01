
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "./transactions/types";
import { DateRangeSelector } from "./transactions/DateRangeSelector";
import { FinancialSummary } from "./transactions/FinancialSummary";
import { TransactionList } from "./transactions/TransactionList";
import { useTransactions } from "./transactions/useTransactions";

interface RecentTransactionsProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const RecentTransactions = ({ dateRange, setDateRange }: RecentTransactionsProps) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const { transactions, isLoading, totals } = useTransactions(dateRange);

  return (
    <Card className="rounded-xl border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Resumo Financeiro</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Período: {dateRange.start === dateRange.end
            ? format(parseISO(dateRange.start), "dd/MM/yyyy", { locale: ptBR })
            : `${format(parseISO(dateRange.start), "dd/MM/yyyy", { locale: ptBR })} a ${format(
                parseISO(dateRange.end),
                "dd/MM/yyyy",
                { locale: ptBR }
              )}`}
        </p>
      </CardHeader>
      <CardContent>
        {/* Date Range Selector */}
        <DateRangeSelector 
          dateRange={dateRange} 
          setDateRange={setDateRange}
          onSelectedTransactionsReset={() => setSelectedTransactions([])}
        />

        {/* Financial Summary */}
        <FinancialSummary totals={totals} />

        {/* Transaction List */}
        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
          selectedTransactions={selectedTransactions}
          setSelectedTransactions={setSelectedTransactions}
        />
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
