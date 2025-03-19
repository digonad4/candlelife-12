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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Transactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1); // Paginação começa em 1
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmPaymentDialogOpen, setIsConfirmPaymentDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [transactionToConfirm, setTransactionToConfirm] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // Termo de busca

  const transactionsPerPage = 5; // Ajustado para 5 dias por página (pode mudar conforme necessidade)

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          client:clients(name)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

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
  const totalPages = Math.ceil(days.length / transactionsPerPage);

  // Paginação dos dias
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentDays = days.slice(startIndex, endIndex);

  // Funções de seleção
  const toggleSelection = (id: string) => {
    const transaction = filteredTransactions.find((t) => t.id === id);
    if (transaction?.payment_method === "invoice") return;
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
      currentDays
        .flatMap(([, transactions]) => transactions)
        .filter((t) => t.payment_method !== "invoice")
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

  // Handlers de eventos da UI
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

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-foreground">Transações</h1>

          <Card className="rounded-xl border-border bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-card-foreground">
                  {searchTerm ? "Resultados da Pesquisa" : "Histórico de Transações"}
                </CardTitle>
                <Input
                  type="text"
                  placeholder="Pesquisar por cliente, descrição, valor ou data..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reseta para a primeira página ao buscar
                  }}
                  className="w-full max-w-md"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center">Carregando...</p>
              ) : days.length === 0 ? (
                <p>Nenhuma transação encontrada.</p>
              ) : (
                <>
                  <DailyTransactionsList
                    days={currentDays}
                    currentDayIndex={0}
                    selectedTransactions={selectedTransactions}
                    isLoading={isLoading}
                    onPageChange={() => {}} // Não usado
                    onSelectTransaction={toggleSelection}
                    onSelectAll={selectAll}
                    onDeselectAll={deselectAll}
                    onEdit={handleEdit}
                    onDelete={handleDeleteTransaction}
                    onConfirmPayment={handleConfirmTransaction}
                    onConfirmSelected={() => setIsConfirmPaymentDialogOpen(true)}
                    onDeleteSelected={() => setIsDeleteDialogOpen(true)}
                  />
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      variant="outline"
                    >
                      Anterior
                    </Button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          variant={currentPage === page ? "default" : "outline"}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || totalPages === 0}
                      variant="outline"
                    >
                      Próximo
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, days.length)} de {days.length} dias
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Edição */}
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

      {/* Confirmação de Exclusão Individual */}
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

      {/* Confirmação de Pagamento Individual */}
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

      {/* Confirmação de Exclusão Múltipla */}
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

      {/* Confirmação de Pagamento Múltiplo */}
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