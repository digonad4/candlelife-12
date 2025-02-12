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
import { Edit2, Trash2, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense";
};

const Transactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    category: "",
    type: "expense" as "expense" | "income"
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user
  });

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditForm({
      description: transaction.description,
      amount: Math.abs(transaction.amount).toString(),
      category: transaction.category,
      type: transaction.type
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
          category: editForm.category,
          type: editForm.type
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

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold">Transações</h1>
          
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <p>Carregando...</p>
                ) : transactions?.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 shadow">
                    <div className="flex gap-3">
                      {transaction.type === "income" ? (
                        <ArrowUpIcon className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 text-red-600" />
                      )}
                      <p>{transaction.description} - R$ {Math.abs(transaction.amount).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setTransactionToDelete(transaction.id); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <Label>Descrição</Label>
            <Input value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} required />
            <Label>Valor</Label>
            <Input type="number" value={editForm.amount} onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))} required />
            <Button type="submit">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Transactions;
