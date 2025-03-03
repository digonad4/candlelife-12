
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Transaction, DateRange } from "@/types/transaction";
import { FinancialSummary } from "./transactions/FinancialSummary";
import { DateRangePicker } from "./transactions/DateRangePicker";
import { TransactionList } from "./transactions/TransactionList";
import { ConfirmPaymentsDialog } from "./transactions/ConfirmPaymentsDialog";

const RecentTransactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateRange, setDateRange] = useState<DateRange>({ start: today, end: today });

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["recent-transactions", user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*, client:clients(name)")
        .eq("user_id", user.id)
        .gte("date", `${dateRange.start}T00:00:00.000Z`)
        .lte("date", `${dateRange.end}T23:59:59.999Z`)
        .order("payment_status", { ascending: false })
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!user,
  });

  const handleConfirmPayments = async () => {
    if (selectedTransactions.length === 0) return;
    try {
      await supabase
        .from("transactions")
        .update({ payment_status: "confirmed" })
        .in("id", selectedTransactions)
        .eq("user_id", user.id);
      toast({ title: "Pagamentos Confirmados", description: "Os pagamentos foram atualizados." });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      setSelectedTransactions([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao confirmar pagamentos.",
        variant: "destructive",
      });
    }
  };

  const handleSelectTransaction = (id: string, isPending: boolean) => {
    if (!isPending) return;
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleOpenConfirmDialog = (ids: string[]) => {
    setSelectedTransactions(ids);
    setIsConfirmDialogOpen(true);
  };

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
        <DateRangePicker 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange} 
        />
        
        <div className="mb-8">
          <FinancialSummary transactions={transactions || []} />
        </div>

        <TransactionList 
          transactions={transactions || []}
          isLoading={isLoading}
          selectedTransactions={selectedTransactions}
          onSelectTransaction={handleSelectTransaction}
          onOpenConfirmDialog={handleOpenConfirmDialog}
        />
      </CardContent>

      <ConfirmPaymentsDialog 
        open={isConfirmDialogOpen} 
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmPayments}
        count={selectedTransactions.length}
      />
    </Card>
  );
};

export default RecentTransactions;
