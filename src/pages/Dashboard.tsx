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
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const channel = supabase
      .channel(`transactions-${user.id}`) // Nome do canal agora é único por usuário
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log("📢 Alteração detectada no banco de dados. Atualizando dashboard...");
          queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["top-categories"] });
          queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
        }
      )
      .subscribe();

    return () => {
      console.log("🛑 Removendo canal do Supabase.");
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen w-full flex">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-8 bg-gray-50 dark:bg-gray-900 overflow-auto">
        <div className="max-w-[2000px] mx-auto space-y-6 md:space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-4xl font-bold">Dashboard</h1>
            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8">
            <ExpenseChart />
            <TopCategories />
          </div>

          <RecentTransactions />

          <Button
            size="lg"
            className="fixed bottom-8 right-8 rounded-full w-14 h-14 md:w-16 md:h-16 shadow-lg"
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
              queryClient.invalidateQueries({ queryKey: ["top-categories"] });
              queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
