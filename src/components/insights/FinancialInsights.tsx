
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingDown, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../ui/button";
import { useState } from "react";

type InsightType = "expense" | "income" | "budget" | "savings";

interface InsightItem {
  type: InsightType;
  title: string;
  description: string;
  action?: string;
  impact: "high" | "medium" | "low";
}

export function FinancialInsights() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const currentDate = new Date();
  const startOfLastMonth = subMonths(currentDate, 1);
  
  // Get transaction data for the past 2 months
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["financial-insights", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const twoMonthsAgo = subMonths(currentDate, 2);
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", twoMonthsAgo.toISOString())
        .order("date", { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
  
  // If loading or no data, show placeholder
  if (isLoading || !transactions) {
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

  // Calculate metrics
  const currentMonthTransactions = transactions.filter(t => 
    new Date(t.date) >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );
  const lastMonthTransactions = transactions.filter(t => 
    new Date(t.date) >= new Date(startOfLastMonth.getFullYear(), startOfLastMonth.getMonth(), 1) &&
    new Date(t.date) < new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );
  
  const currentMonthExpenses = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((total, t) => total + Math.abs(t.amount), 0);
    
  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((total, t) => total + Math.abs(t.amount), 0);
    
  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === "income" && t.payment_status === "confirmed")
    .reduce((total, t) => total + t.amount, 0);
    
  const lastMonthIncome = lastMonthTransactions
    .filter(t => t.type === "income" && t.payment_status === "confirmed")
    .reduce((total, t) => total + t.amount, 0);

  // Get top spending categories
  const expensesByCategory: Record<string, number> = {};
  currentMonthTransactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      const category = t.description.split(" ")[0].toLowerCase();
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(t.amount);
    });
    
  // Sort categories by amount
  const topCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
    
  // Generate insights
  const insights: InsightItem[] = [];
  
  // Expense trends
  if (currentMonthExpenses > lastMonthExpenses * 1.2) {
    insights.push({
      type: "expense",
      title: "Suas despesas aumentaram",
      description: `Suas despesas aumentaram ${Math.round((currentMonthExpenses / lastMonthExpenses - 1) * 100)}% em relação ao mês passado. Considere revisar seus gastos.`,
      impact: "high"
    });
  }
  
  // Income trends
  if (currentMonthIncome < lastMonthIncome * 0.9) {
    insights.push({
      type: "income",
      title: "Sua receita diminuiu",
      description: `Sua receita diminuiu ${Math.round((1 - currentMonthIncome / lastMonthIncome) * 100)}% em relação ao mês passado.`,
      impact: "high"
    });
  }
  
  // Top spending category insight
  if (topCategories.length > 0) {
    insights.push({
      type: "expense",
      title: `Alto gasto em ${topCategories[0][0]}`,
      description: `Você gastou R$ ${topCategories[0][1].toFixed(2)} em ${topCategories[0][0]} este mês, o que representa uma parte significativa das suas despesas.`,
      action: "Considere estabelecer um limite mensal para esta categoria.",
      impact: "medium"
    });
  }
  
  // Savings ratio insight
  const savingsRatio = (currentMonthIncome - currentMonthExpenses) / currentMonthIncome;
  if (savingsRatio < 0.2 && currentMonthIncome > 0) {
    insights.push({
      type: "savings",
      title: "Baixa taxa de poupança",
      description: "Você está economizando menos de 20% da sua receita. Especialistas recomendam economizar pelo menos 20-30% da receita mensal.",
      action: "Tente reduzir gastos não essenciais para aumentar sua taxa de poupança.",
      impact: "medium"
    });
  }
  
  // Budget suggestion
  if (currentMonthExpenses > currentMonthIncome * 0.8) {
    insights.push({
      type: "budget",
      title: "Orçamento desbalanceado",
      description: "Seus gastos estão próximos ou ultrapassam sua receita. Isso pode levar a problemas financeiros no futuro.",
      action: "Estabeleça um orçamento mensal e categorize seus gastos para melhor controle.",
      impact: "high"
    });
  }
  
  // Add financial health insight
  if (insights.length === 0) {
    insights.push({
      type: "savings",
      title: "Finanças saudáveis",
      description: "Seus indicadores financeiros estão em boa forma! Continue com o bom trabalho de gestão financeira.",
      impact: "low"
    });
  }
  
  const displayedInsights = expanded ? insights : insights.slice(0, 2);
  
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
          Baseado em sua atividade financeira de {format(startOfLastMonth, "MMMM", { locale: ptBR })} a {format(currentDate, "MMMM", { locale: ptBR })}.
        </p>
        
        {displayedInsights.map((insight, index) => (
          <Alert 
            key={index} 
            className={
              insight.impact === "high" 
                ? "border-l-4 border-l-red-500" 
                : insight.impact === "medium" 
                  ? "border-l-4 border-l-yellow-500" 
                  : "border-l-4 border-l-green-500"
            }
          >
            <div className="flex items-start gap-3">
              {insight.type === "expense" ? (
                <TrendingDown className={insight.impact === "high" ? "h-5 w-5 text-red-500" : "h-5 w-5 text-yellow-500"} />
              ) : insight.type === "income" ? (
                <TrendingUp className="h-5 w-5 text-yellow-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-500" />
              )}
              <div>
                <AlertTitle className="font-semibold">{insight.title}</AlertTitle>
                <AlertDescription className="mt-1">
                  {insight.description}
                  {insight.action && (
                    <p className="mt-2 font-medium text-primary">{insight.action}</p>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
        
        {insights.length > 2 && (
          <Button 
            variant="ghost" 
            className="w-full mt-2" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ver menos insights" : "Ver mais insights"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
