
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { subMonths } from "date-fns";
import { Transaction } from "@/types/insights";
import { calculateFinancialData } from "@/utils/financialUtils";

export function useFinancialData() {
  const { user } = useAuth();
  const currentDate = useMemo(() => new Date(), []);

  // Fetch de transações com cache
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["financial-insights", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const threeMonthsAgo = subMonths(currentDate, 3);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", threeMonthsAgo.toISOString())
        .order("date", { ascending: false });
      if (error) throw error;
      return data.map((transaction) => ({
        ...transaction,
        type: transaction.type as "expense" | "income",
        payment_status: transaction.payment_status as "confirmed" | "pending" | "failed" | undefined,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  // Calculate financial data
  const financialData = useMemo(() => 
    calculateFinancialData(transactions), [transactions]);

  return {
    financialData,
    isLoading
  };
}
