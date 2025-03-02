
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { ExpenseModal } from "@/components/ExpenseModal";
import RecentTransactions from "@/components/RecentTransactions";
import { ExpenseChart } from "@/components/ExpenseChart";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const Dashboard = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayStats, setTodayStats] = useState({ total: 0, count: 0 });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadTodayStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', today.toISOString())
        .lt('date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

      if (!error && data) {
        const total = data.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
        setTodayStats({
          total,
          count: data.length
        });
      }
    };

    loadTodayStats();

    const channel = supabase
      .channel(`transactions-${user.id}`)
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
          queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
          loadTodayStats();
        }
      )
      .subscribe();

    return () => {
      console.log("🛑 Removendo canal do Supabase.");
      supabase.removeChannel(channel);
    };
  }, [queryClient, user.id, navigate, user]);

  if (!user) return null;

  return (
    <div className="min-h-screen w-full flex bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-[2000px] mx-auto space-y-6 md:space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-4xl font-bold">Dashboard</h1>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => {
                supabase.auth.signOut();
                navigate("/login");
              }}>
                Logout
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Resumo de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Movimentado
                  </p>
                  <h2 className="text-2xl font-bold">
                    {formatCurrency(todayStats.total)}
                  </h2>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Quantidade de Transações
                  </p>
                  <h2 className="text-2xl font-bold">
                    {todayStats.count}
                  </h2>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-full">
            <ExpenseChart />
          </div>

          <RecentTransactions />
        </div>

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
            queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
          }}
        />
      </main>
    </div>
  );
};

export default Dashboard;
