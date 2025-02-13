
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { ExpenseModal } from "@/components/ExpenseModal";
import { RecentTransactions } from "@/components/RecentTransactions";
import { ExpenseChart } from "@/components/ExpenseChart";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Plus, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

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
        }
      )
      .subscribe();

    return () => {
      console.log("🛑 Removendo canal do Supabase.");
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id, navigate]);

  if (!user) return null;

  const SidebarContent = <AppSidebar />;

  return (
    <div className="min-h-screen w-full flex bg-background">
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            {SidebarContent}
          </SheetContent>
        </Sheet>
      ) : (
        SidebarContent
      )}

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-[2000px] mx-auto space-y-6 md:space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-4xl font-bold">Dashboard</h1>
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
          </div>

          <div className="w-full">
            <ExpenseChart />
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
              queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
