
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { InvoicedTransactionCard } from "@/components/invoiced/InvoicedTransactionCard";
import { ConfirmPaymentsDialog } from "@/components/invoiced/ConfirmPaymentsDialog";
import { useInvoicedTransactions } from "@/hooks/useInvoicedTransactions";

const InvoicedTransactions = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const { transactions, isLoading, confirmPayments } = useInvoicedTransactions(user?.id, selectedDate);

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
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

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-foreground">Transações Faturadas</h1>
            {selectedTransactions.length > 0 && (
              <Button
                onClick={() => setIsConfirmDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirmar Selecionados ({selectedTransactions.length})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <DatePicker
              selected={selectedDate}
              onSelect={setSelectedDate}
              placeholder="Selecione uma data"
              className="w-[200px]"
            />
            {selectedDate && (
              <Button variant="outline" onClick={() => setSelectedDate(undefined)}>
                Limpar Filtro
              </Button>
            )}
          </div>
          
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
                    {selectedDate && " para esta data"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

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
