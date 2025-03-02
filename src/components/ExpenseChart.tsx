
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExpenseChartProps {
  dateRange?: {
    start: string;
    end: string;
  };
}

export const ExpenseChart = ({ dateRange }: ExpenseChartProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dia");

  // Use date range if provided, otherwise default to current month
  const today = new Date();
  const currentMonthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const currentMonthEnd = format(endOfMonth(today), "yyyy-MM-dd");
  
  const effectiveDateRange = dateRange || {
    start: currentMonthStart,
    end: currentMonthEnd
  };

  const { data: transactions = [] } = useQuery({
    queryKey: ["expense-chart", user?.id, effectiveDateRange, activeTab],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", `${effectiveDateRange.start}T00:00:00.000Z`)
        .lte("date", `${effectiveDateRange.end}T23:59:59.999Z`)
        .order("date", { ascending: true });

      if (error) {
        console.error("Erro ao buscar transações:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
  });

  // Agrupa transações por dia, mês, ou semana
  const groupedData = useMemo(() => {
    if (!transactions.length) return [];

    // Cria um array de todas as datas no intervalo
    const dateInterval = eachDayOfInterval({
      start: parseISO(effectiveDateRange.start),
      end: parseISO(effectiveDateRange.end)
    });

    // Para visualização por dia
    if (activeTab === "dia") {
      return dateInterval.map(date => {
        const dayTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return isSameDay(transactionDate, date);
        });

        const income = dayTransactions
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expense = dayTransactions
          .filter(t => t.type === "expense")
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

        return {
          name: format(date, "dd/MM", { locale: ptBR }),
          income,
          expense,
          balance: income - expense,
        };
      });
    }

    // Para visualização por mês (não usado no filtro atual, mas mantido para extensibilidade)
    if (activeTab === "mes") {
      const months = {};
      transactions.forEach(t => {
        const month = format(new Date(t.date), "MM/yyyy");
        if (!months[month]) {
          months[month] = { income: 0, expense: 0 };
        }
        if (t.type === "income") {
          months[month].income += Number(t.amount);
        } else {
          months[month].expense += Math.abs(Number(t.amount));
        }
      });

      return Object.entries(months).map(([month, data]) => ({
        name: month,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
      }));
    }

    // Por padrão, retorna dados agrupados por dia
    return dateInterval.map(date => {
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return isSameDay(transactionDate, date);
      });

      const income = dayTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = dayTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      return {
        name: format(date, "dd/MM", { locale: ptBR }),
        income,
        expense,
        balance: income - expense,
      };
    });
  }, [transactions, activeTab, effectiveDateRange]);

  return (
    <Card className="rounded-xl border-border bg-card mt-8">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-card-foreground">Fluxo Financeiro</CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xs">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="dia">Por Dia</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          {groupedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={groupedData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, ""]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="income" name="Receitas" fill="#22c55e">
                  {groupedData.map((entry, index) => (
                    <Cell key={`cell-income-${index}`} fill="#22c55e" />
                  ))}
                </Bar>
                <Bar dataKey="expense" name="Despesas" fill="#ef4444">
                  {groupedData.map((entry, index) => (
                    <Cell key={`cell-expense-${index}`} fill="#ef4444" />
                  ))}
                </Bar>
                <Bar dataKey="balance" name="Saldo" fill="#3b82f6">
                  {groupedData.map((entry, index) => (
                    <Cell 
                      key={`cell-balance-${index}`} 
                      fill={entry.balance >= 0 ? "#3b82f6" : "#f97316"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Nenhum dado para o período selecionado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
