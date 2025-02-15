
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUpIcon, ArrowDownIcon, Calendar, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
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

const InvoicedTransactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["invoiced-transactions", user?.id, selectedDate],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("transactions")
        .select(`
          *,
          client:clients(name)
        `)
        .eq("user_id", user.id)
        .eq("payment_method", "invoice")
        .order("date", { ascending: false });

      if (selectedDate) {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

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

  const handleConfirmSelectedPayments = async () => {
    if (!user || selectedTransactions.length === 0) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ payment_status: "confirmed" })
        .in("id", selectedTransactions)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Pagamentos confirmados",
        description: "Os pagamentos selecionados foram confirmados com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["invoiced-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
      setSelectedTransactions([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error("Erro ao confirmar pagamentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar os pagamentos.",
        variant: "destructive",
      });
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
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
                  <div key={transaction.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors">
                    <Checkbox
                      id={`transaction-${transaction.id}`}
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                      disabled={transaction.payment_status === "confirmed"}
                    />
                    <div className="flex-1 flex items-center justify-between">
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
                  </div>
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

      {/* Confirmação de Pagamentos */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Confirmar Pagamentos</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja confirmar o recebimento dos {selectedTransactions.length} pagamentos selecionados?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSelectedPayments} className="bg-green-600 text-white hover:bg-green-700">
              Confirmar Pagamentos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvoicedTransactions;
