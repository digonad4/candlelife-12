
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
  Bar,
  Line,
} from "recharts";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

type DailyData = {
  date: string;
  expenses: number;
  income: number;
  balance: number;
  cumulativeBalance: number;
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

      // Initialize data for each day
      const dailyData: DailyData[] = dates.map(date => {
        const dateStr = format(date, "dd/MM");
        return {
          date: dateStr,
          expenses: 0,
          income: 0,
          balance: 0,
          cumulativeBalance: 0
        };
      });

      // Populate with actual transaction data
      transactions.forEach(transaction => {
        const dateStr = format(new Date(transaction.date), "dd/MM");
        const dayData = dailyData.find(d => d.date === dateStr);
        if (dayData) {
          if (transaction.type === "expense") {
            dayData.expenses += Math.abs(transaction.amount);
          } else {
            dayData.income += transaction.amount;
          }
          dayData.balance = dayData.income - dayData.expenses;
        }
      });

      // Calculate cumulative balance
      let runningBalance = 0;
      dailyData.forEach(day => {
        runningBalance += day.balance;
        day.cumulativeBalance = runningBalance;
      });

      return dailyData;
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
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
        <CardTitle>Monthly Overview</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              dataKey="expenses"
              fill="#ef4444"
              name="Expenses"
              opacity={0.6}
            />
            <Bar
              dataKey="income"
              fill="#22c55e"
              name="Income"
              opacity={0.6}
            />
            <Line
              type="monotone"
              dataKey="cumulativeBalance"
              stroke="#8884d8"
              name="Balance"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
