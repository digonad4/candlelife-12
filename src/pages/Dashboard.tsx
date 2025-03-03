
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, startOfDay, endOfDay, subDays, subMonths, subYears, isBefore } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState("last7days");
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Atualiza as datas baseado na seleção do período
    const updateDateRange = (range: string) => {
      const today = new Date();
      
      switch (range) {
        case "today":
          setStartDate(startOfDay(today));
          setEndDate(endOfDay(today));
          break;
        case "last7days":
          setStartDate(subDays(today, 7));
          setEndDate(today);
          break;
        case "last30days":
          setStartDate(subDays(today, 30));
          setEndDate(today);
          break;
        case "last6months":
          setStartDate(subMonths(today, 6));
          setEndDate(today);
          break;
        case "lastyear":
          setStartDate(subYears(today, 1));
          setEndDate(today);
          break;
        case "custom":
          // Mantém as datas personalizadas selecionadas
          break;
      }
    };

    if (dateRange !== "custom") {
      updateDateRange(dateRange);
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
  }, [queryClient, user.id, navigate, user, dateRange, startDate, endDate]);

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

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select
              value={dateRange}
              onValueChange={(value) => {
                setDateRange(value);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                <SelectItem value="last6months">Últimos 6 meses</SelectItem>
                <SelectItem value="lastyear">Último ano</SelectItem>
                <SelectItem value="custom">Período personalizado</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === "custom" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <DatePicker
                  placeholder="Data inicial"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date && endDate && isBefore(endDate, date)) {
                      setEndDate(addDays(date, 1));
                    }
                    setStartDate(date);
                  }}
                  className="w-full sm:w-auto"
                />
                <DatePicker
                  placeholder="Data final"
                  selected={endDate}
                  onSelect={(date) => setEndDate(date)}
                  className="w-full sm:w-auto"
                />
              </div>
            )}
          </div>

          {/* RecentTransactions moved to the top */}
          <RecentTransactions />

          <div className="w-full">
            <ExpenseChart startDate={startDate} endDate={endDate} />
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
