import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenses } from "@/hooks/useExpenses";

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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  const { transactions, isLoading, confirmPayments } = useExpenses(
    user?.id,
    startDate,
    endDate,
    paymentStatusFilter,
    "all", // paymentMethodFilter
    "all", // categoryFilter
    0,     // p0
    10,    // p1
    ""     // descriptionFilter
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
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Gestão de Despesas</h1>
        {selectedTransactions.length > 0 && (
          <Button
            onClick={handleConfirmSelectedPayments}
            className="bg-green-600 hover:bg-green-700"
          >
            Confirmar Selecionados ({selectedTransactions.length})
          </Button>
        )}
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Data Inicial</label>
              <DatePicker
                selected={startDate}
                onSelect={setStartDate}
                placeholder="Data Inicial"
                className="w-full md:w-[200px]"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Data Final</label>
              <DatePicker
                selected={endDate}
                onSelect={setEndDate}
                placeholder="Data Final"
                className="w-full md:w-[200px]"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleClearFilters} className="mt-6 md:mt-0">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Histórico de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : transactions?.map((transaction) => (
              <div
                key={transaction.id}
                className={`p-4 border rounded-lg ${selectedTransactions.includes(transaction.id) ? "bg-gray-100" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selectedTransactions.includes(transaction.id)}
                  onChange={() => toggleTransactionSelection(transaction.id)}
                  className="mr-2"
                  title={`Selecionar ${transaction.description}`}
                />
                <span>{transaction.description}</span> -{" "}
                <span>
                  {transaction.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span> -{" "}
                <span>{transaction.payment_status === "pending" ? "Pendente" : "Confirmado"}</span>
              </div>
            ))}
            {(!transactions || transactions.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma despesa encontrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesManagement;