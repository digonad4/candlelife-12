import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Chart } from "react-google-charts";
import { ChartType } from "react-google-charts";
import { parseISO, format, startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

export function ExpenseChart() {
  const { user } = useAuth();
  const [chartType, setChartType] = useState<ChartType>("CandlestickChart"); // Gráfico de velas como padrão
  const [timeRange, setTimeRange] = useState("individual"); // "individual", "daily", "weekly", "monthly", "yearly"

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["expense-chart", user?.id, chartType, timeRange],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("date, amount")
        .eq("user_id", user.id)
        .eq("payment_status", "confirmed")
        .order("date");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [["Data", "Menor", "Abertura", "Fechamento", "Maior"]];
    }

    let accumulatedValue = 0;
    const processedTransactions = [];

    if (timeRange === "individual") { // Velas individuais
      return [
        ["Data", "Menor", "Abertura", "Fechamento", "Maior"],
        ...transactions.map((t) => {
          const dateFormatted = format(parseISO(t.date), "dd/MM", { locale: ptBR });

          const open = accumulatedValue;
          const close = accumulatedValue + t.amount;
          const low = Math.min(open, close);
          const high = Math.max(open, close);

          accumulatedValue = close;

          return [dateFormatted, low, open, close, high];
        }),
      ];
    } else { // Agrupamento por período
      transactions.forEach((t) => {
        let dateFormatted;
        switch (timeRange) {
          case "daily":
            dateFormatted = format(startOfDay(parseISO(t.date)), "dd/MM", { locale: ptBR });
            break;
          case "weekly":
            dateFormatted = format(startOfWeek(parseISO(t.date), { locale: ptBR }), "dd/MM/yyyy", { locale: ptBR });
            break;
          case "monthly":
            dateFormatted = format(startOfMonth(parseISO(t.date)), "MM/yyyy", { locale: ptBR });
            break;
          case "yearly":
            dateFormatted = format(startOfYear(parseISO(t.date)), "yyyy", { locale: ptBR });
            break;
          default:
            dateFormatted = format(parseISO(t.date), "dd/MM", { locale: ptBR });
        }

        const existingTransaction = processedTransactions.find(item => item.date === dateFormatted);

        if (existingTransaction) {
          existingTransaction.amount += t.amount;
        } else {
          processedTransactions.push({ date: dateFormatted, amount: t.amount });
        }
      });

      if (chartType === "CandlestickChart") {
        return [
          ["Data", "Menor", "Abertura", "Fechamento", "Maior"],
          ...processedTransactions.map((t) => {
            const open = accumulatedValue;
            const close = accumulatedValue + t.amount;
            const low = Math.min(open, close);
            const high = Math.max(open, close);

            accumulatedValue = close;

            return [t.date, low, open, close, high];
          }),
        ];
      } else {
        return [["Data", "Valor"], ...processedTransactions.map((t) => [t.date, t.amount])];
      }
    }
  }, [transactions, chartType, timeRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu desempenho (apenas transações confirmadas)</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] flex flex-col">
  {isLoading ? (
    <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />
  ) : transactions.length === 0 ? (
    <p className="text-gray-500">Nenhuma transação confirmada registrada.</p>
  ) : (
    <div className="flex flex-col h-full">
      <div className="h-[400px] flex-1">
        <Chart
          width="100%"
          height="100%"
          chartType={chartType}
          loader={<div>Carregando Gráfico...</div>}
          data={chartData}
          options={{
            legend: "none",
            candlestick: {
              fallingColor: { strokeWidth: 0, fill: "#ef4444" },
              risingColor: { strokeWidth: 0, fill: "#22c55e" },
            },
            vAxis: {
              title: "Valor Acumulado (R$)",
              format: "decimal",
            },
            hAxis: {
              title: "Data",
            },
            backgroundColor: "transparent",
            chartArea: {
              width: "80%",
              height: "80%",
            },
          }}
        />
      </div>
      <div className="flex flex-wrap justify-center mt-4 space-x-2">
  <button
    onClick={() => setTimeRange("individual")}
    className={`px-3 py-1 text-sm rounded ${
      timeRange === "individual"
        ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white"
        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }`}
  >
    Padrão
  </button>
  <button
    onClick={() => setTimeRange("daily")}
    className={`px-3 py-1 text-sm rounded ${
      timeRange === "daily"
        ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white"
        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }`}
  >
    Diário
  </button>
  <button
    onClick={() => setTimeRange("weekly")}
    className={`px-3 py-1 text-sm rounded ${
      timeRange === "weekly"
        ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white"
        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }`}
  >
    Semanal
  </button>
  <button
    onClick={() => setTimeRange("monthly")}
    className={`px-3 py-1 text-sm rounded ${
      timeRange === "monthly"
        ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white"
        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }`}
  >
    Mensal
  </button>
  <button
    onClick={() => setTimeRange("yearly")}
    className={`px-3 py-1 text-sm rounded ${
      timeRange === "yearly"
        ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white"
        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }`}
  >
    Anual
  </button>
</div>
    </div>
  )}
</CardContent>

    </Card>
  );
}