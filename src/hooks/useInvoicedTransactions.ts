
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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

export function useInvoicedTransactions(userId: string | undefined, selectedDate: Date | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["invoiced-transactions", userId, selectedDate],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from("transactions")
        .select(`
          *,
          client:clients(name)
        `)
        .eq("user_id", userId)
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
    enabled: !!userId,
  });

  const confirmPayments = async (transactionIds: string[]) => {
    if (!userId || transactionIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ payment_status: "confirmed" })
        .in("id", transactionIds)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Pagamentos confirmados",
        description: "Os pagamentos selecionados foram confirmados com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["invoiced-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["expense-chart"] });

      return true;
    } catch (error) {
      console.error("Erro ao confirmar pagamentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar os pagamentos.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    transactions,
    isLoading,
    confirmPayments,
  };
}
