
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Edit2, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

  const { data: categories } = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

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
        description: "Falha ao atualizar transação",
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
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 bg-gray-100 rounded-xl animate-pulse"
                    />
                  ))
                ) : transactions?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex gap-3">
                      <div className={`rounded-full p-2 ${
                        transaction.type === "income" 
                          ? "bg-green-100 dark:bg-green-900/20" 
                          : "bg-red-100 dark:bg-red-900/20"
                      }`}>
                        {transaction.type === "income" ? (
                          <ArrowUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.category}</p>
                        <p className="text-xs text-gray-400">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`font-mono font-medium ${
                          transaction.type === "income"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        R$ {Math.abs(transaction.amount).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma transação encontrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup
                value={editForm.type}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value as "expense" | "income" }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense" className="text-red-500 dark:text-red-400">Despesa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income" className="text-green-500 dark:text-green-400">Receita</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={editForm.amount}
                onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Digite o valor"
                required
                className={editForm.type === "expense" ? "border-red-200" : "border-green-200"}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Digite a descrição"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={editForm.category} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem 
                      key={cat.id} 
                      value={cat.name}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
