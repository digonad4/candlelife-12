
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { GoogleChartWrapperChartType } from "react-google-charts";

type Transaction = {
  date: string;
  amount: number;
};

export function useTransactionData(chartType: GoogleChartWrapperChartType, timeRange: string, startDateISO?: string, endDateISO?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["expense-chart", user?.id, chartType, timeRange, startDateISO, endDateISO],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("transactions")
        .select("date, amount, client:clients(name)")
        .eq("user_id", user.id)
        .eq("payment_status", "confirmed")
        .order("date");
      
      if (startDateISO) {
        query = query.gte("date", startDateISO);
      }
      
      if (endDateISO) {
        query = query.lte("date", endDateISO);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Transaction[] || [];
    },
    enabled: !!user,
  });
}
