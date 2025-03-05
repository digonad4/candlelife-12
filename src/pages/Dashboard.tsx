
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { ExpenseModal } from "@/components/ExpenseModal";
import { RecentTransactions } from "@/components/RecentTransactions";
import { TopCategories } from "@/components/TopCategories";
import { ExpenseChart } from "@/components/ExpenseChart";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("public:transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["top-categories"] });
          queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ExpenseChart />
            <TopCategories />
          </div>

          <RecentTransactions />

          <Button
            className="fixed bottom-8 right-8 rounded-full w-16 h-16 shadow-lg"
            onClick={() => setIsModalOpen(true)}
          >
            +
          </Button>

          <ExpenseModal 
            open={isModalOpen} 
            onOpenChange={setIsModalOpen} 
            onTransactionAdded={() => {
              queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
