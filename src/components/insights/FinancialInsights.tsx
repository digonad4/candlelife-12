
import { useState } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

import { useFinancialData } from "@/hooks/useFinancialData";
import { InsightSkeleton } from "./InsightSkeleton";
import { InsightCard } from "./InsightCard";
import { generateInsights } from "./InsightGenerator";

export function FinancialInsights() {
  const [expanded, setExpanded] = useState(false);
  const { financialData, isLoading } = useFinancialData();
  const currentDate = new Date();

  if (isLoading || !financialData) {
    return <InsightSkeleton />;
  }

  // Generate insights from financial data
  const insights = generateInsights(financialData);
  const displayedInsights = expanded ? insights : insights.slice(0, 3);

  // Renderização dos insights com design aprimorado
  return (
    <Card className="w-full bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <Lightbulb className="h-5 w-5 text-primary" />
          Insights Financeiros Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Análise personalizada de {format(subMonths(currentDate, 1), "MMMM", { locale: ptBR })} a {format(currentDate, "MMMM", { locale: ptBR })}.
        </p>
        
        <div className="space-y-4">
          {displayedInsights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
        
        {insights.length > 3 && (
          <Button 
            variant="outline" 
            className="w-full mt-4 border-dashed" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ver menos" : `Ver mais ${insights.length - 3} insights`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
