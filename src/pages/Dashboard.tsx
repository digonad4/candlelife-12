
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ExpenseModal } from "@/components/ExpenseModal";
import RecentTransactions from "@/components/RecentTransactions";
import { ExpenseChart } from "@/components/ExpenseChart";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { subDays } from "date-fns";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { EnhancedFinancialInsights } from "@/components/insights/EnhancedFinancialInsights";

const Dashboard = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();

  // Set up Supabase real-time subscription for transaction changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`transactions-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log("📢 Alteração detectada no banco de dados. Atualizando dashboard...");
          queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
          queryClient.invalidateQueries({ queryKey: ["financial-insights"] });
        }
      )
      .subscribe();

    return () => {
      console.log("🛑 Removendo canal do Supabase.");
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-4xl font-bold">Resumo Financeiro</h1>
      </div>

      {/* Date selector */}
      <DateFilter
        dateRange={dateRange}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={setDateRange}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* Enhanced Financial Insights with Goals */}
      <EnhancedFinancialInsights />

      {/* Chart */}
      <div className="w-full">
        <ExpenseChart startDate={startDate} endDate={endDate} />
      </div>

      {/* Transactions and values */}
      <RecentTransactions startDate={startDate} endDate={endDate} />

      {/* Rounded button to add transaction */}
      <Button
        size="lg"
        className="fixed bottom-7 right-7 rounded-full w-14 h-14 md:w-16 md:h-16 shadow-lg flex items-center justify-center z-40"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <ExpenseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onTransactionAdded={() => {
          console.log("📌 Nova transação adicionada. Invalidando cache...");
          queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
          queryClient.invalidateQueries({ queryKey: ["financial-insights"] });
          queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
        }}
      />
    </div>
  );
};

export default Dashboard;
