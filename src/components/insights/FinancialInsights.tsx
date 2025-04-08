
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFinancialInsights } from "@/hooks/useFinancialInsights";
import { InsightsList } from "./InsightsList";

export function FinancialInsights() {
  const { 
    insights, 
    isLoading, 
    financialData,
    currentDate,
    lastMonth
  } = useFinancialInsights();

  if (isLoading || !financialData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Insights Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Analisando seus dados financeiros...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Insights Financeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Análise de {format(lastMonth, "MMMM", { locale: ptBR })} a {format(currentDate, "MMMM", { locale: ptBR })}.
        </p>
        <InsightsList insights={insights} />
      </CardContent>
    </Card>
  );
}
