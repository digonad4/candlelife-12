import { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { GoogleChartWrapperChartType } from "react-google-charts";
import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/spinner";

interface Transaction {
  date: string;
  amount: number;
}

interface ChartDataProps {
  transactions: Transaction[];
  chartType: GoogleChartWrapperChartType;
  timeRange: string;
  isLoading: boolean;
}

interface ChartDataResult {
  labels: string[];
  data: any[];
  min: number;
  max: number;
  total: number;
}

export function ChartData({ transactions, chartType, timeRange, isLoading }: ChartDataProps) {
  const [chartData, setChartData] = useState<ChartDataResult | null>(null);

  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setChartData(null);
      return;
    }

    // Process the transaction data for chart visualization
    const labels = ["Data", "Valor"];
    const data = [labels];

    let min = Infinity;
    let max = -Infinity;
    let total = 0;

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date).toLocaleDateString();
      const amount = transaction.amount;

      data.push([date, amount]);

      if (amount < min) {
        min = amount;
      }

      if (amount > max) {
        max = amount;
      }

      total += amount;
    });

    setChartData({ labels, data, min, max, total });
  }, [transactions, timeRange]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!chartData || !chartData.data || chartData.data.length <= 1) {
    return (
      <Card className="flex justify-center items-center h-64">
        <p className="text-muted-foreground text-center">
          Nenhuma transação disponível para visualização.
          <br />
          Adicione transações para ver o gráfico.
        </p>
      </Card>
    );
  }

  return (
    <div className="h-80">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-sm text-muted-foreground">Menor valor</p>
          <p className="text-xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chartData.min)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-sm text-muted-foreground">Maior valor</p>
          <p className="text-xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chartData.max)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md col-span-2">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chartData.total)}
          </p>
        </div>
      </div>

      <Chart
        chartType={chartType}
        data={chartData.data}
        options={{
          title: "Transações",
          curveType: "function",
          legend: { position: "bottom" },
        }}
        width="100%"
        height="300px"
      />
    </div>
  );
}
