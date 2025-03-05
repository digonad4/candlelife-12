
import { CardHeader, CardTitle } from "@/components/ui/card";

interface ChartHeaderProps {
  periodLabel: string;
}

export function ChartHeader({ periodLabel }: ChartHeaderProps) {
  return (
    <CardHeader>
      <CardTitle>Seu desempenho de {periodLabel}</CardTitle>
    </CardHeader>
  );
}
