
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Transaction } from "./types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpIcon, ArrowDownIcon, CheckCircle2, Calendar, CreditCard } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface TransactionListProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
  selectedTransactions: string[];
  setSelectedTransactions: (ids: string[]) => void;
}

export const TransactionList = ({
  transactions,
  isLoading,
  selectedTransactions,
  setSelectedTransactions,
}: TransactionListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleConfirmPayments = async () => {
    if (selectedTransactions.length === 0) return;
    try {
      await supabase
        .from("transactions")
        .update({ payment_status: "confirmed" })
        .in("id", selectedTransactions)
        .eq("user_id", user.id);
      toast({ title: "Pagamentos Confirmados", description: "Os pagamentos foram atualizados." });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      setSelectedTransactions([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao confirmar pagamentos.",
        variant: "destructive",
      });
    }
  };

  const handleSelectTransaction = (id: string, isPending: boolean) => {
    if (!isPending) return;
    setSelectedTransactions(
      selectedTransactions.includes(id) 
        ? selectedTransactions.filter((t) => t !== id) 
        : [...selectedTransactions, id]
    );
  };

  if (isLoading) {
    return <p className="text-muted-foreground dark:text-gray-400">Carregando...</p>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 dark:text-gray-400">
        Nenhuma transação para o período selecionado.
      </p>
    );
  }

  return (
    <>
      {selectedTransactions.length > 0 && (
        <Button
          onClick={() => setIsConfirmDialogOpen(true)}
          className="mb-4 bg-green-600 hover:bg-green-700 text-sm py-1 px-3 dark:bg-green-500 dark:hover:bg-green-600"
        >
          Confirmar {selectedTransactions.length} Pagamento(s)
        </Button>
      )}
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent/20 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <div className="flex gap-2 items-center">
              {transaction.payment_status === "pending" && (
                <Checkbox
                  checked={selectedTransactions.includes(transaction.id)}
                  onCheckedChange={() =>
                    handleSelectTransaction(transaction.id, transaction.payment_status === "pending")
                  }
                />
              )}
              <div
                className={`p-1 rounded-full ${
                  transaction.type === "income"
                    ? "bg-green-500/20 text-green-500 dark:bg-green-500/30 dark:text-green-400"
                    : "bg-red-500/20 text-red-500 dark:bg-red-500/30 dark:text-red-400"
                }`}
              >
                {transaction.type === "income" ? (
                  <ArrowUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground dark:text-gray-200">{transaction.description}</p>
                <p className="text-xs text-muted-foreground dark:text-gray-400">
                  <Calendar className="inline w-3 h-3 mr-1" />
                  {format(parseISO(transaction.date), "dd/MM/yyyy HH:mm", { locale: ptBR })} -{" "}
                  {transaction.payment_status === "pending" ? "Pendente" : "Confirmada"} -{" "}
                  <CreditCard className="inline w-3 h-3 mr-1" />
                  {transaction.payment_method === "cash"
                    ? "Dinheiro"
                    : transaction.payment_method === "pix"
                    ? "Pix"
                    : "Faturado"}
                </p>
                {transaction.client?.name && (
                  <p className="text-xs text-muted-foreground dark:text-gray-400">Cliente: {transaction.client.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p
                className={`text-sm font-medium ${
                  transaction.amount >= 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                }`}
              >
                R$ {transaction.amount.toFixed(2)}
              </p>
              {transaction.payment_status === "pending" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedTransactions([transaction.id]);
                    setIsConfirmDialogOpen(true);
                  }}
                  className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 w-6 h-6"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="bg-card dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground dark:text-gray-200">
              Confirmar Pagamento(s)
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Deseja confirmar o recebimento de {selectedTransactions.length} pagamento(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:text-gray-200 dark:hover:bg-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayments}
              className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              Confirmar Pagamento(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
