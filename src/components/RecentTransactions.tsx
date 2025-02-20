import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUpIcon, ArrowDownIcon, CheckCircle2, Clock, Calendar, CreditCard } from "lucide-react";
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

const RecentTransactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [transactionToConfirm, setTransactionToConfirm] = useState(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["recent-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*, client:clients(name)")
        .eq("user_id", user.id)
        .eq("payment_status", "pending")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleConfirmPayment = async () => {
    if (!transactionToConfirm) return;
    try {
      await supabase
        .from("transactions")
        .update({ payment_status: "confirmed" })
        .eq("id", transactionToConfirm.id)
        .eq("user_id", user.id);
      toast({ title: "Pagamento Confirmado", description: "O pagamento foi atualizado." });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      setTransactionToConfirm(null);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao confirmar pagamento.", variant: "destructive" });
    }
  };

  return (
    <Card className="rounded-xl border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Transações Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : transactions?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma transação pendente.</p>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors">
              <div className="flex gap-3">
                <div className={`p-2 rounded-full ${transaction.type === "income" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                  {transaction.type === "income" ? (
                    <ArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-card-foreground">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    <Calendar className="inline w-4 h-4" /> {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                    &nbsp;&nbsp;<CreditCard className="inline w-4 h-4" /> {transaction.payment_method}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setTransactionToConfirm(transaction); setIsConfirmDialogOpen(true); }}
                  className="text-yellow-500 hover:text-yellow-600"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
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
    </Card>
  );
};

export default RecentTransactions;
