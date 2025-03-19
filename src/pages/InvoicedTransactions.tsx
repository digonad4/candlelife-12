import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { InvoicedTransactionCard } from "@/components/invoiced/InvoicedTransactionCard";
import { ConfirmPaymentsDialog } from "@/components/invoiced/ConfirmPaymentsDialog";
import { useInvoicedTransactions } from "@/hooks/useInvoicedTransactions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const InvoicedTransactions = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all"); // Filtro de status
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Ajuste no hook para suportar intervalo de datas
  const { transactions, isLoading, confirmPayments } = useInvoicedTransactions(
    user?.id,
    startDate,
    endDate,
    paymentStatusFilter
  );

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

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setPaymentStatusFilter("all");
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Transações Faturadas</h1>
        {selectedTransactions.length > 0 && (
          <Button
            onClick={() => setIsConfirmDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Confirmar Selecionados ({selectedTransactions.length})
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex gap-4">
          <DatePicker
            selected={startDate}
            onSelect={setStartDate}
            placeholder="Data Inicial"
            className="w-full md:w-[200px]"
          />
          <DatePicker
            selected={endDate}
            onSelect={setEndDate}
            placeholder="Data Final"
            className="w-full md:w-[200px]"
          />
        </div>
        <Select
          value={paymentStatusFilter}
          onValueChange={setPaymentStatusFilter}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
          </SelectContent>
        </Select>
        {(startDate || endDate || paymentStatusFilter !== "all") && (
          <Button variant="outline" onClick={handleClearFilters}>
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="rounded-xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Histórico de Transações Faturadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : transactions?.map((transaction) => (
                <InvoicedTransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  isSelected={selectedTransactions.includes(transaction.id)}
                  onToggleSelection={toggleTransactionSelection}
                />
              ))}
              {(!transactions || transactions.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma transação faturada encontrada
                  {(startDate || endDate) && " para o período selecionado"}
                </p>
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

export default InvoicedTransactions;