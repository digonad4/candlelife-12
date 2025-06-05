
import { useState, useEffect, useRef } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);
  const subscriptionInProgressRef = useRef<boolean>(false);

  // Set up Supabase real-time subscription for transaction changes
  useEffect(() => {
    const currentUserId = user?.id || null;
    
    // If user changed or logged out, clean up existing channel
    if (userIdRef.current !== currentUserId) {
      if (channelRef.current) {
        console.log("🛑 User changed, cleaning up dashboard channel");
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn("Error removing channel:", error);
        }
        channelRef.current = null;
        subscriptionInProgressRef.current = false;
      }
      userIdRef.current = currentUserId;
    }

    if (!currentUserId) {
      return;
    }
    
    // If we already have a subscription in progress or completed, don't create another one
    if (subscriptionInProgressRef.current) {
      console.log("📡 Dashboard subscription already in progress, skipping");
      return;
    }

    // Clean up any existing channel before creating a new one
    if (channelRef.current) {
      console.log("🛑 Cleaning up existing dashboard channel before creating new one");
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn("Error removing existing channel:", error);
      }
      channelRef.current = null;
    }
    
    // Create unique channel name to avoid conflicts
    const channelName = `dashboard-transactions-${currentUserId}-${Date.now()}`;
    console.log("📡 Creating dashboard channel:", channelName);
    
    const channel = supabase.channel(channelName).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "transactions",
      filter: `user_id=eq.${currentUserId}`
    }, () => {
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
    });
    
    // Store reference and mark subscription as in progress BEFORE subscribing
    channelRef.current = channel;
    subscriptionInProgressRef.current = true;
    
    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log("Dashboard channel subscription status:", status);
      if (status === 'CLOSED') {
        console.log("🛑 Dashboard channel subscription closed");
        subscriptionInProgressRef.current = false;
      }
    });
    
    return () => {
      console.log("🛑 Removendo canal do Dashboard:", channelName);
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn("Error removing channel:", error);
        }
        channelRef.current = null;
        subscriptionInProgressRef.current = false;
      }
    };
  }, [queryClient, user?.id]);

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

      {/* Rounded button to add transaction - positioned above mobile footer */}
      <Button 
        size="lg" 
        onClick={() => setIsModalOpen(true)} 
        className={`fixed shadow-lg flex items-center justify-center z-40 rounded-full w-14 h-14 md:w-16 md:h-16 ${
          isMobile 
            ? 'bottom-20 right-6' // Above mobile footer (64px + 16px = 80px from bottom)
            : 'bottom-6 right-6'  // Normal position on desktop
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
