
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
import { DatePicker } from "@/components/ui/date-picker";
import { format, subDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Estado para armazenar datas selecionadas
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });

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
  }, [queryClient, user?.id, navigate, user]);

  // Handler para quando uma data é selecionada
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      
      const formattedDate = format(date, "yyyy-MM-dd");
      setDateRange({
        start: formattedDate,
        end: formattedDate
      });
    }
  };

  // Manipuladores para navegação rápida de datas
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    const formattedDate = format(today, "yyyy-MM-dd");
    setDateRange({
      start: formattedDate,
      end: formattedDate
    });
  };

  const goToYesterday = () => {
    const yesterday = subDays(new Date(), 1);
    setSelectedDate(yesterday);
    const formattedDate = format(yesterday, "yyyy-MM-dd");
    setDateRange({
      start: formattedDate,
      end: formattedDate
    });
  };

  const goToTomorrow = () => {
    const tomorrow = addDays(new Date(), 1);
    setSelectedDate(tomorrow);
    const formattedDate = format(tomorrow, "yyyy-MM-dd");
    setDateRange({
      start: formattedDate,
      end: formattedDate
    });
  };

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

          {/* Seletor de data com navegação rápida */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <DatePicker
              selected={selectedDate}
              onSelect={handleDateSelect}
              placeholder="Selecione uma data"
              className="w-full sm:w-auto"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToYesterday}>
                Ontem
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={goToTomorrow}>
                Amanhã
              </Button>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <RecentTransactions dateRange={dateRange} setDateRange={setDateRange} />

          {/* Gráfico de Despesas */}
          <div className="w-full">
            <ExpenseChart dateRange={dateRange} />
          </div>
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
