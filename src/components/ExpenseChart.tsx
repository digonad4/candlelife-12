
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Chart } from "react-google-charts";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ExpenseChart() {
  const { user } = useAuth();

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["expense-chart", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date");

      if (error) throw error;

      // Create a date range for the current month
      const dates = eachDayOfInterval({ start: startDate, end: endDate });

      // Calcular valores acumulados
      let runningTotal = 0;
      const dailyData = dates.map(date => {
        const dayTransactions = transactions.filter(t => {
          const transactionDate = parseISO(t.date);
          return format(transactionDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
        });

        const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
        runningTotal += dayTotal;

        return [
          format(date, "dd/MM", { locale: ptBR }),
          runningTotal,
        ];
      });

      return [['Data', 'Valor Acumulado'], ...dailyData];
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa Mensal</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Caixa Mensal</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Chart
          width="100%"
          height="400px"
          chartType="LineChart"
          loader={<div>Carregando Gráfico...</div>}
          data={chartData}
          options={{
            curveType: 'function',
            legend: 'none',
            colors: ['#4F46E5'],
            vAxis: {
              title: 'Valor Acumulado (R$)',
              format: 'currency',
              formatOptions: { currency: 'BRL' }
            },
            hAxis: {
              title: 'Data'
            },
            backgroundColor: 'transparent',
            chartArea: {
              width: '80%',
              height: '80%'
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
