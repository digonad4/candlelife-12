
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function ExpenseChart() {
  const data = [
    { date: "01/03", open: 400, close: 350, high: 450, low: 320, volume: 1000 },
    { date: "02/03", open: 350, close: 380, high: 400, low: 340, volume: 1200 },
    { date: "03/03", open: 380, close: 360, high: 390, low: 350, volume: 800 },
    { date: "04/03", open: 360, close: 390, high: 400, low: 355, volume: 1100 },
    { date: "05/03", open: 390, close: 420, high: 430, low: 380, volume: 1500 },
    { date: "06/03", open: 420, close: 410, high: 440, low: 400, volume: 1300 },
  ];

  return (
    <Card className="rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Análise de Gastos</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              yAxisId="left"
              dataKey="volume"
              fill="#8884d8"
              opacity={0.3}
              name="Volume"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="close"
              stroke="#ff7300"
              name="Valor"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
