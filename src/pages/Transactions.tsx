import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Edit2, Trash2, ArrowUpIcon, ArrowDownIcon, Calendar, CreditCard, CheckCircle2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  AlertDialogDescription
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  payment_method: string;
  payment_status: "pending" | "confirmed";
  client_id?: string;
  client?: {
    name: string;
  };
};

const Transactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    type: "expense" as "expense" | "income",
    payment_method: "",
    payment_status: "pending" as "pending" | "confirmed"
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmPaymentDialogOpen, setIsConfirmPaymentDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [transactionToConfirm, setTransactionToConfirm] = useState<Transaction | null>(null);

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
    enabled: !!user
  });

  const transactionsByDay = transactions?.reduce((acc, transaction) => {
    const dateKey = format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const days = transactionsByDay ? Object.entries(transactionsByDay) : [];
  const currentDay = days[currentDayIndex] || [];
  const currentTransactions = currentDay[1] || [];

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(currentTransactions.map(t => t.id));
    setSelectedTransactions(allIds);
  };

  const deselectAll = () => {
    setSelectedTransactions(new Set());
  };

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

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditForm({
      description: transaction.description,
      amount: Math.abs(transaction.amount).toString(),
      type: transaction.type,
      payment_method: transaction.payment_method,
      payment_status: transaction.payment_status
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTransaction) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          description: editForm.description,
          amount: editForm.type === "expense" ? -Math.abs(Number(editForm.amount)) : Math.abs(Number(editForm.amount)),
          type: editForm.type,
          payment_method: editForm.payment_method,
          payment_status: editForm.payment_status
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
      console.error("Erro ao atualizar transação:", error);
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
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
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
      console.error("Erro ao confirmar pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o pagamento.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-foreground">Transações</h1>

          <Card className="rounded-xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-card-foreground">
                {days.length > 0 ? currentDay[0] : "Histórico de Transações"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDayIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentDayIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentDayIndex + 1} de {days.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDayIndex(prev => Math.min(days.length - 1, prev + 1))}
                  disabled={currentDayIndex === days.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentTransactions.length > 0 && (
                <div className="mb-6 flex gap-2 flex-wrap">
                  <Button 
                    size="sm"
                    onClick={selectAll}
                    className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    
                  </Button>
                  <Button 
                    size="sm"
                    onClick={deselectAll}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                  
                  </Button>
                  {selectedTransactions.size > 0 && (
                    <>
                      <Button 
                        size="sm"
                        onClick={() => setIsConfirmPaymentDialogOpen(true)}
                        disabled={!Array.from(selectedTransactions).some(id => 
                          currentTransactions.find(t => t.id === id)?.payment_status === "pending"
                        )}
                        className="bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Confirmar ({selectedTransactions.size})
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Excluir ({selectedTransactions.size})
                      </Button>
                    </>
                  )}
                </div>
              )}

              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : currentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {currentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={() => toggleSelection(transaction.id)}
                          className="border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              transaction.type === "income" 
                                ? "bg-green-500/20 text-green-500" 
                                : "bg-red-500/20 text-red-500"
                            }`}>
                              {transaction.type === "income" ? (
                                <ArrowUpIcon className="w-4 h-4" />
                              ) : (
                                <ArrowDownIcon className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-card-foreground">{transaction.description}</p>
                              <p className={`text-lg font-semibold ${
                                transaction.type === "income" 
                                  ? "text-green-500" 
                                  : "text-red-500"
                              }`}>
                                R$ {Math.abs(transaction.amount).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              <span>{transaction.payment_method}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {transaction.payment_status === "confirmed" ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-500" />
                              )}
                              <span className={transaction.payment_status === "confirmed" ? "text-green-500" : "text-yellow-500"}>
                                {transaction.payment_status === "confirmed" ? "Confirmado" : "Pendente"}
                              </span>
                            </div>
                            {transaction.client?.name && (
                              <div className="flex items-center gap-1">
                                <span>Cliente: {transaction.client.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {transaction.payment_status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setTransactionToConfirm(transaction);
                              setIsConfirmPaymentDialogOpen(true);
                            }}
                            className="text-yellow-500 hover:text-yellow-600"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { 
                            setTransactionToDelete(transaction.id); 
                            setIsDeleteDialogOpen(true); 
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada para este dia
                </p>
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
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input 
                id="description"
                value={editForm.description} 
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} 
                className="bg-background"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input 
                id="amount"
                type="number" 
                value={editForm.amount} 
                onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))} 
                className="bg-background"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup
                value={editForm.type}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value as "income" | "expense" }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income">Receita</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense">Despesa</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento</Label>
              <Select
                value={editForm.payment_method}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="invoice">Faturado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status">Status do Pagamento</Label>
              <Select
                value={editForm.payment_status}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, payment_status: value as "pending" | "confirmed" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">Salvar</Button>
          </form>
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