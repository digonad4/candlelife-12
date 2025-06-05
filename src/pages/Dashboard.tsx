
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ExpenseModal } from "@/components/ExpenseModal";
import RecentTransactions from "@/components/RecentTransactions";
import { ExpenseChart } from "@/components/ExpenseChart";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { subDays } from "date-fns";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { EnhancedFinancialInsights } from "@/components/insights/EnhancedFinancialInsights";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

const Dashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();

  // Usar o novo hook para subscription robusta
  useRealtimeSubscription({
    channelName: 'dashboard-transactions',
<<<<<<< HEAD
    filters: [{
      event: '*',
      schema: 'public',
      table: 'transactions',
      filter: `user_id=eq.${user?.id || ''}`
    }],
=======
    filters: [
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user?.id || ''}`
      }
    ],
>>>>>>> a54c83b6aeb620917159af6bd1e06b32ec0fcdef
    onSubscriptionChange: () => {
      console.log("📢 Alteração detectada no banco de dados. Atualizando dashboard...");
      queryClient.invalidateQueries({
        queryKey: ["recent-transactions"]
      });
      queryClient.invalidateQueries({
        queryKey: ["expense-chart"]
      });
      queryClient.invalidateQueries({
        queryKey: ["financial-insights"]
      });
    },
    dependencies: [user?.id]
  });

  return (
    <div className="w-full space-y-8 safe-area-top safe-area-bottom">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-4xl font-bold my-[37px]">Resumo Financeiro</h1>
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

      {/* Rounded button to add transaction - positioned above mobile footer */}
      <Button 
        size="lg" 
        onClick={() => setIsModalOpen(true)} 
        className={`fixed shadow-lg flex items-center justify-center z-40 rounded-full w-14 h-14 md:w-16 md:h-16 ${
          isMobile 
            ? 'bottom-20 right-6 safe-area-bottom' // Above mobile footer + safe area
            : 'bottom-6 right-6' // Normal position on desktop
        }`}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <ExpenseModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onTransactionAdded={() => {
          console.log("📌 Nova transação adicionada. Invalidando cache...");
          queryClient.invalidateQueries({
            queryKey: ["recent-transactions"]
          });
          queryClient.invalidateQueries({
            queryKey: ["expense-chart"]
          });
          queryClient.invalidateQueries({
            queryKey: ["financial-insights"]
          });
          queryClient.invalidateQueries({
            queryKey: ["financial-goals"]
          });
        }} 
      />
    </div>
  );
};

export default Dashboard;
