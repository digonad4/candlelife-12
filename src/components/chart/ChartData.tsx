
import { useMemo } from "react";
import { Chart } from "react-google-charts";
import { GoogleChartWrapperChartType } from "react-google-charts";
import { parseISO, format, startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChartDataProps {
  transactions: Array<{ date: string; amount: number }>;
  chartType: GoogleChartWrapperChartType;
  timeRange: string;
  isLoading: boolean;
}

export function ChartData({ transactions, chartType, timeRange, isLoading }: ChartDataProps) {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [["Data", "Menor", "Abertura", "Fechamento", "Maior"]];
    }

    const processedData = transactions.reduce((acc, transaction) => {
      let dateKey;
      const date = parseISO(transaction.date);

      switch (timeRange) {
        case "individual":
          dateKey = format(date, "dd/MM", { locale: ptBR });
          break;
        case "daily":
          dateKey = format(startOfDay(date), "dd/MM", { locale: ptBR });
          break;
        case "weekly":
          dateKey = format(startOfWeek(date, { locale: ptBR }), "dd/MM/yyyy", { locale: ptBR });
          break;
        case "monthly":
          dateKey = format(startOfMonth(date), "MM/yyyy", { locale: ptBR });
          break;
        case "yearly":
          dateKey = format(startOfYear(date), "yyyy", { locale: ptBR });
          break;
        default:
          dateKey = format(date, "dd/MM", { locale: ptBR });
      }

      if (!acc[dateKey]) {
        acc[dateKey] = { total: 0, min: transaction.amount, max: transaction.amount };
      }
      
      acc[dateKey].total += transaction.amount;
      acc[dateKey].min = Math.min(acc[dateKey].min, acc[dateKey].total);
      acc[dateKey].max = Math.max(acc[dateKey].max, acc[dateKey].total);
      
      return acc;
    }, {});

    const chartRows = Object.entries(processedData).map(([date, data]) => [
      date,
      data.min,
      data.min,
      data.total,
      data.max,
    ]);

    return [
      ["Data", "Menor", "Abertura", "Fechamento", "Maior"],
      ...chartRows,
    ];
  }, [transactions, timeRange]);

  if (isLoading) {
    return <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Nenhuma transação encontrada neste período.</p>
      </div>
    );
  }

  return (
    <Chart
      width="100%"
      height="100%"
      chartType={chartType}
      loader={<div className="flex items-center justify-center h-full">Carregando Gráfico...</div>}
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
          textPosition: "out",
        },
        backgroundColor: "transparent",
        chartArea: {
          width: "80%",
          height: "80%",
        },
      }}
    />
  );
}
