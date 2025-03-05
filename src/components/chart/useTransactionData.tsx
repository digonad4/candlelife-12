
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { GoogleChartWrapperChartType } from "react-google-charts";
import { format } from "date-fns";

type Transaction = {
  date: string;
  amount: number;
};

export function useTransactionData(
  chartType: GoogleChartWrapperChartType, 
  timeRange: string, 
  startDateISO?: string, 
  endDateISO?: string
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["expense-chart", user?.id, chartType, timeRange, startDateISO, endDateISO],
    queryFn: async () => {
      if (!user) return [];

      try {
        console.log("Fetching transaction data with:", {
          userId: user.id,
          startDate: startDateISO,
          endDate: endDateISO
        });

        let query = supabase
          .from("transactions")
          .select("date, amount")
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

        if (error) {
          console.error("Error fetching transaction data:", error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} transactions`);
        return data as Transaction[] || [];
      } catch (error) {
        console.error("Error in useTransactionData:", error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
