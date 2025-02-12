
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Scatter,
} from "recharts";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, startOfDay, endOfDay } from "date-fns";

type DailyData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

const CustomCandlestick = (props: any) => {
  const { x, y, fill, width, low, high, open, close } = props;

  const isRising = close > open;
  const color = isRising ? "#22c55e" : "#ef4444";
  const bodyHeight = Math.abs(open - close);
  const bodyY = Math.min(open, close);

  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={y + high}
        x2={x + width / 2}
        y2={y + low}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x}
        y={y + bodyY}
        width={width}
        height={bodyHeight || 1}
        fill={color}
        stroke={color}
      />
    </g>
  );
};

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
      const dailyData: DailyData[] = dates.map(date => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayTransactions = transactions.filter(t => {
          const transactionDate = parseISO(t.date);
          return transactionDate >= dayStart && transactionDate <= dayEnd;
        });

        if (dayTransactions.length === 0) {
          return {
            date: format(date, "dd/MM"),
            open: 0,
            high: 0,
            low: 0,
            close: 0
          };
        }

        const values = dayTransactions.map(t => t.amount);
        const netValue = values.reduce((sum, val) => sum + val, 0);

        return {
          date: format(date, "dd/MM"),
          open: dayTransactions[0].amount,
          high: Math.max(...values),
          low: Math.min(...values),
          close: dayTransactions[dayTransactions.length - 1].amount
        };
      });

      return dailyData;
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
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend />
            <CartesianGrid strokeDasharray="3 3" />
            <Scatter
              data={chartData}
              shape={<CustomCandlestick width={20} />}
              name="Transações"
              fill="#8884d8"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
