
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleChartWrapperChartType } from "react-google-charts";
import { ChartData } from "./chart/ChartData";
import { TimeRangeSelector } from "./chart/TimeRangeSelector";
import { usePeriodLabel } from "./chart/usePeriodLabel";
import { useTransactionData } from "./chart/useTransactionData";

interface ExpenseChartProps {
  startDate?: Date;
  endDate?: Date;
}

export function ExpenseChart({ startDate, endDate }: ExpenseChartProps) {
  const [chartType, setChartType] = useState<GoogleChartWrapperChartType>("CandlestickChart"); // Gráfico de velas como padrão
  const [timeRange, setTimeRange] = useState("individual"); // "individual", "daily", "weekly", "monthly", "yearly"
  
  const startDateISO = startDate ? startDate.toISOString() : undefined;
  const endDateISO = endDate ? endDate.toISOString() : undefined;

  const { data: transactions, isLoading } = useTransactionData(chartType, timeRange, startDateISO, endDateISO);
  const periodLabel = usePeriodLabel(startDate, endDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu desempenho para {periodLabel} (apenas transações confirmadas)</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] flex flex-col">
        <div className="flex flex-col h-full">
          <div className="h-[400px] flex-1">
            <ChartData 
              transactions={transactions || []} 
              chartType={chartType} 
              timeRange={timeRange} 
              isLoading={isLoading} 
            />
          </div>
          <TimeRangeSelector 
            timeRange={timeRange} 
            onTimeRangeChange={setTimeRange} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
