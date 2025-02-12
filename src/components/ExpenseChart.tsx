
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Chart } from "react-google-charts";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, startOfDay, endOfDay } from "date-fns";
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

      // Process data for candlestick chart
      // Format: ['Data', 'Menor', 'Abertura', 'Fechamento', 'Maior']
      const dailyData = dates.map(date => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayTransactions = transactions.filter(t => {
          const transactionDate = parseISO(t.date);
          return transactionDate >= dayStart && transactionDate <= dayEnd;
        });

        if (dayTransactions.length === 0) {
          return [format(date, "dd/MM", { locale: ptBR }), 0, 0, 0, 0];
        }

        const values = dayTransactions.map(t => t.amount);
        const open = dayTransactions[0].amount;
        const close = dayTransactions[dayTransactions.length - 1].amount;
        const high = Math.max(...values);
        const low = Math.min(...values);

        return [
          format(date, "dd/MM", { locale: ptBR }),
          low,
          open,
          close,
          high,
        ];
      });

      return [['Data', 'Menor', 'Abertura', 'Fechamento', 'Maior'], ...dailyData];
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visão Mensal</CardTitle>
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
        <CardTitle>Visão Mensal</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Chart
          width="100%"
          height="400px"
          chartType="CandlestickChart"
          loader={<div>Carregando Gráfico...</div>}
          data={chartData}
          options={{
            legend: 'none',
            candlestick: {
              fallingColor: { strokeWidth: 0, fill: '#ef4444' },
              risingColor: { strokeWidth: 0, fill: '#22c55e' }
            },
            vAxis: {
              title: 'Valor (R$)',
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
