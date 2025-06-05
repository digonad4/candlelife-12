import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { InvoicedTransactionCard } from "@/components/invoiced/InvoicedTransactionCard";
import { ConfirmPaymentsDialog } from "@/components/invoiced/ConfirmPaymentsDialog";
import { useExpenses } from "@/hooks/useExpenses";
import { Plus } from "lucide-react";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, format } from "date-fns";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  payment_method: string;
  payment_status: "pending" | "confirmed";
};

const ExpensesManagement = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<string>("today");
  const [startDate, setStartDate] = useState<Date>(() => startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date>(() => endOfDay(new Date()));
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [descriptionFilter, setDescriptionFilter] = useState<string>("");
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);
  const subscriptionInProgressRef = useRef<boolean>(false);

  const { transactions, isLoading, confirmPayments } = useExpenses(
    user?.id,
    startDate,
    endDate,
    paymentStatusFilter,
    "all",
    "all",
    0,
    10,
    descriptionFilter
  );

  useEffect(() => {
    const currentUserId = user?.id || null;
    
    // If user changed or logged out, clean up existing channel
    if (userIdRef.current !== currentUserId) {
      if (channelRef.current) {
        console.log("🛑 User changed, cleaning up expenses channel");
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn("Error removing channel:", error);
        }
        channelRef.current = null;
        subscriptionInProgressRef.current = false;
      }
      userIdRef.current = currentUserId;
    }

    if (!currentUserId) {
      return;
    }

    // If we already have a subscription in progress or completed, don't create another one
    if (subscriptionInProgressRef.current) {
      console.log("📡 Expenses subscription already in progress, skipping");
      return;
    }

    // Clean up any existing channel before creating a new one
    if (channelRef.current) {
      console.log("🛑 Cleaning up existing expenses channel before creating new one");
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn("Error removing existing channel:", error);
      }
      channelRef.current = null;
    }

    // Create unique channel name to avoid conflicts
    const channelName = `expenses-transactions-${currentUserId}-${Date.now()}`;
    console.log("📡 Creating expenses channel:", channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          console.log("📢 Alteração detectada em despesas. Atualizando...");
          queryClient.invalidateQueries({ queryKey: ["expenses"] });
        }
      );

    // Store reference and mark subscription as in progress BEFORE subscribing
    channelRef.current = channel;
    subscriptionInProgressRef.current = true;

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log("Expenses channel subscription status:", status);
      if (status === 'CLOSED') {
        console.log("🛑 Expenses channel subscription closed");
        subscriptionInProgressRef.current = false;
      }
    });

    return () => {
      console.log("🛑 Removendo canal de Despesas:", channelName);
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn("Error removing channel:", error);
        }
        channelRef.current = null;
        subscriptionInProgressRef.current = false;
      }
    };
  }, [queryClient, user?.id]);

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleConfirmSelectedPayments = async () => {
    const success = await confirmPayments(selectedTransactions);
    if (success) {
      setSelectedTransactions([]);
      setIsConfirmDialogOpen(false);
    }
  };

  const handleResetFilters = () => {
    setDateRange("today");
    setStartDate(startOfDay(new Date()));
    setEndDate(endOfDay(new Date()));
    setPaymentStatusFilter("all");
    setDescriptionFilter("");
  };

  // Calcular o valor total das transações exibidas
  const totalAmount = transactions?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
  const formattedTotal = totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Formatar o intervalo de datas
  const formattedDateRange =
    startDate && endDate
      ? `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`
      : "Selecione um período";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">Despesas</h1>
        {selectedTransactions.length > 0 && (
          <Button
            onClick={() => setIsConfirmDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Confirmar Selecionados ({selectedTransactions.length})
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <DateFilter
            dateRange={dateRange}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={setDateRange}
            onStartDateChange={(date) => date && setStartDate(date)}
            onEndDateChange={(date) => date && setEndDate(date)}
          />
          <span className="text-sm font-medium text-muted-foreground  px-3 py-1 rounded-md">
             {formattedDateRange}
          </span>
          {(dateRange !== "today" || paymentStatusFilter !== "all" || descriptionFilter !== "") && (
            <Button variant="outline" onClick={handleResetFilters}>
              Limpar Filtros
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Pesquisar por descrição..."
            value={descriptionFilter}
            onChange={(e) => setDescriptionFilter(e.target.value)}
            className="w-full md:w-[300px]"
          />
          
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="rounded-xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Histórico de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : (
                transactions?.map((transaction) => (
                  <InvoicedTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    isSelected={selectedTransactions.includes(transaction.id)}
                    onToggleSelection={toggleTransactionSelection}
                  />
                ))
              )}
              {(!transactions || transactions.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma despesa encontrada
                  {(dateRange !== "today" || descriptionFilter) && " para os filtros selecionados"}
                </p>
              )}
              {transactions && transactions.length > 0 && (
                <div className="mt-4 text-right text-lg font-semibold text-foreground">
                  Total: {formattedTotal}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <ConfirmPaymentsDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        selectedCount={selectedTransactions.length}
        onConfirm={handleConfirmSelectedPayments}
      />
    </div>
  );
};

export default ExpensesManagement;
