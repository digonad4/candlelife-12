import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Transaction } from "@/types/transaction";
import { EditTransactionForm, EditFormData } from "@/components/transactions/EditTransactionForm";
import { DailyTransactionsList } from "@/components/transactions/DailyTransactionsList";
import { Input } from "@/components/ui/input";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { Button } from "@/components/ui/button";

const TransactionSummary = ({
  totalTransactions,
  totalIncome,
  totalExpenses,
  balance,
}: {
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}) => (
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

const Transactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmPaymentDialogOpen, setIsConfirmPaymentDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [transactionToConfirm, setTransactionToConfirm] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("transactions")
        .select(`
          *,
          client:clients(name)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (startDate && endDate) {
        query = query
          .gte("date", startDate.toISOString())
          .lte("date", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  // Filtrar transações com base no termo de busca
  const filteredTransactions = transactions?.filter((transaction) => {
    const clientName = transaction.client?.name || "";
    const description = transaction.description || "";
    const amount = transaction.amount.toString();
    const date = format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const searchLower = searchTerm.toLowerCase();
    return (
      clientName.toLowerCase().includes(searchLower) ||
      description.toLowerCase().includes(searchLower) ||
      amount.includes(searchLower) ||
      date.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Agrupar transações por dia
  const transactionsByDay = filteredTransactions.reduce((acc, transaction) => {
    const dateKey = format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const days = Object.entries(transactionsByDay);

  // Calcular totais
  const totalTransactions = filteredTransactions.length;
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpenses;

  // Função de impressão ajustada
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write("<html><head><title>CandleLife Finanças</title>");
      printWindow.document.write(`
        <style>
          @media print {
            body {
              width: 58mm;
              font-family: monospace;
              font-size: 10px;
              line-height: 1.2;
              margin: 0;
              padding: 5mm;
            }
            h1 { font-size: 12px; text-align: center; margin-bottom: 5px; }
            h2 { font-size: 10px; margin: 5px 0; }
            p { margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .totals { margin-top: 10px; }
          }
        </style>
      `);
      printWindow.document.write("</head><body>");
      printWindow.document.write("<h1>Extrato de Transações</h1>");
      printWindow.document.write(`<p>Usuário: ${user?.user_metadata?.username || "N/A"}</p>`);
      printWindow.document.write(`<p>Email: ${user?.email || "N/A"}</p>`);
      printWindow.document.write(`<p>Período: ${startDate?.toLocaleDateString("pt-BR")} a ${endDate?.toLocaleDateString("pt-BR")}</p>`);
      printWindow.document.write("<div class='divider'></div>");
      days.forEach(([date, transactions]) => {
        printWindow.document.write(``);
        transactions.forEach((t) => {
          printWindow.document.write(
            `<p>${t.description} ${t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${t.type === "income" ? "R" : "D"})</p>`
          );
        });
        printWindow.document.write("<div class='divider'></div>");
      });
      printWindow.document.write("<div class='totals'>");
      printWindow.document.write(`<p>Total Transações: ${totalTransactions}</p>`);
      printWindow.document.write(`<p>Receitas: ${totalIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>`);
      printWindow.document.write(`<p>Despesas: ${totalExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>`);
      printWindow.document.write(`<p>Saldo: ${balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>`);
      printWindow.document.write("</div>");
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Funções de seleção
  const toggleSelection = (id: string) => {
    const transaction = filteredTransactions.find((t) => t.id === id);
    if (transaction?.payment_method === "invoice" && transaction.payment_status !== "confirmed") return;
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(
      days
        .flatMap(([, transactions]) => transactions)
        .filter((t) => t.payment_method !== "invoice" || t.payment_status === "confirmed")
        .map((t) => t.id)
    );
    setSelectedTransactions(allIds);
  };

  const deselectAll = () => {
    setSelectedTransactions(new Set());
  };

  // Ações em massa
  const handleBulkConfirm = async () => {
    if (!user || selectedTransactions.size === 0) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ payment_status: "confirmed" })
        .in("id", Array.from(selectedTransactions))
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Pagamentos confirmados",
        description: `${selectedTransactions.size} transações foram confirmadas.`,
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setSelectedTransactions(new Set());
      setIsConfirmPaymentDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar os pagamentos.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedTransactions.size === 0) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", Array.from(selectedTransactions))
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Transações excluídas",
        description: `${selectedTransactions.size} transações foram removidas.`,
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setSelectedTransactions(new Set());
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir as transações.",
        variant: "destructive",
      });
    }
  };

  // Ações individuais
  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async (formData: EditFormData) => {
    if (!user || !selectedTransaction) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          description: formData.description,
          amount: formData.type === "expense" ? -Math.abs(Number(formData.amount)) : Math.abs(Number(formData.amount)),
          type: formData.type,
          payment_method: formData.payment_method,
          payment_status: formData.payment_status,
          client_id: formData.client_id || null,
        })
        .eq("id", selectedTransaction.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso",
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setIsEditModalOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar a transação",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!user || !transactionToDelete) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionToDelete)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Transação excluída",
        description: "A transação foi removida com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPayment = async () => {
    if (!user || !transactionToConfirm) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ payment_status: "confirmed" })
        .eq("id", transactionToConfirm.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Pagamento confirmado",
        description: "O status do pagamento foi atualizado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setIsConfirmPaymentDialogOpen(false);
      setTransactionToConfirm(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o pagamento.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmTransaction = (transaction: Transaction) => {
    if (transaction.payment_method === "invoice") {
      toast({
        title: "Ação não permitida",
        description: "Transações faturadas não podem ser confirmadas aqui.",
        variant: "destructive",
      });
      return;
    }
    setTransactionToConfirm(transaction);
    setIsConfirmPaymentDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-foreground">Transações</h1>
          <DateFilter
            dateRange={dateRange}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={setDateRange}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <div className="flex justify-end">
            <Button onClick={handlePrint}>Imprimir Extrato</Button>
          </div>
          <Card className="rounded-xl border-border bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <CardTitle className="text-card-foreground">
                  {searchTerm ? "Resultados da Pesquisa" : "Histórico de Transações"}
                </CardTitle>
                <Input
                  type="text"
                  placeholder="Pesquisar por cliente, descrição, valor ou data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-1/3"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : days.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma transação encontrada para o período selecionado.</p>
              ) : (
                <DailyTransactionsList
                  days={days}
                  selectedTransactions={selectedTransactions}
                  isLoading={isLoading}
                  onSelectTransaction={toggleSelection}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
                  onEdit={handleEdit}
                  onDelete={handleDeleteTransaction}
                  onConfirmPayment={handleConfirmTransaction}
                  onConfirmSelected={() => setIsConfirmPaymentDialogOpen(true)}
                  onDeleteSelected={() => setIsDeleteDialogOpen(true)}
                />
              )}
            </CardContent>
          </Card>
          <TransactionSummary
            totalTransactions={totalTransactions}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            balance={balance}
          />
        </div>
      </main>

      {/* Modais */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Editar Transação</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <EditTransactionForm transaction={selectedTransaction} onSubmit={handleSubmitEdit} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen && !!transactionToDelete} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmPaymentDialogOpen && !!transactionToConfirm} onOpenChange={setIsConfirmPaymentDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja confirmar o recebimento do pagamento desta transação?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPayment} className="bg-green-600 text-white hover:bg-green-700">
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen && !transactionToDelete} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente {selectedTransactions.size} transação(ões).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmPaymentDialogOpen && !transactionToConfirm} onOpenChange={setIsConfirmPaymentDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Confirmar Pagamentos</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja confirmar o recebimento de {selectedTransactions.size} pagamento(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkConfirm} className="bg-green-600 text-white hover:bg-green-700">
              Confirmar Pagamentos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Transactions;