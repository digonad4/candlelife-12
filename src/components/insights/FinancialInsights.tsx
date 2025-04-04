
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingDown, TrendingUp, AlertCircle, Lightbulb, PiggyBank, Target, DollarSign, BarChart4 } from "lucide-react";
import { subMonths, format, differenceInDays, isSameMonth, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../ui/button";
import { useState } from "react";

type InsightType = "expense" | "income" | "budget" | "savings" | "trend" | "opportunity";

interface InsightItem {
  type: InsightType;
  title: string;
  description: string;
  action?: string;
  impact: "high" | "medium" | "low";
  icon?: React.ReactNode;
}

export function FinancialInsights() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const currentDate = new Date();
  const startOfLastMonth = subMonths(currentDate, 1);
  
  // Get transaction data for the past 3 months for better trend analysis
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["financial-insights", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const threeMonthsAgo = subMonths(currentDate, 3);
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", threeMonthsAgo.toISOString())
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

  // Group transactions by month for trend analysis
  const groupedByMonth: Record<string, any[]> = {};
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = [];
    }
    
    groupedByMonth[monthKey].push(transaction);
  });

  const months = Object.keys(groupedByMonth).sort().reverse();
  
  // Calculate metrics for current month and previous months
  const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
  const lastMonthKey = `${startOfLastMonth.getFullYear()}-${startOfLastMonth.getMonth() + 1}`;
  
  const currentMonthTransactions = groupedByMonth[currentMonthKey] || [];
  const lastMonthTransactions = groupedByMonth[lastMonthKey] || [];
  
  // Calculate expenses and income by month
  const monthlyMetrics = months.map(month => {
    const monthTransactions = groupedByMonth[month];
    const expenses = monthTransactions
      .filter(t => t.type === "expense")
      .reduce((total, t) => total + Math.abs(t.amount), 0);
    
    const income = monthTransactions
      .filter(t => t.type === "income" && t.payment_status === "confirmed")
      .reduce((total, t) => total + t.amount, 0);
      
    const pendingIncome = monthTransactions
      .filter(t => t.type === "income" && t.payment_status !== "confirmed")
      .reduce((total, t) => total + t.amount, 0);
    
    return { month, expenses, income, pendingIncome };
  });
  
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

  // Get monthly savings rate (current month vs previous months)
  const monthlySavingsRates = monthlyMetrics.map(({ month, income, expenses }) => {
    return {
      month,
      savingsRate: income > 0 ? (income - expenses) / income : 0
    };
  });

  // Advanced Analysis: Daily spending rate
  const daysInCurrentMonth = differenceInDays(
    endOfMonth(currentDate),
    startOfMonth(currentDate)
  ) + 1;
  
  const currentDayOfMonth = currentDate.getDate();
  const remainingDaysInMonth = daysInCurrentMonth - currentDayOfMonth;
  
  const dailySpendingRate = currentMonthExpenses / currentDayOfMonth;
  const projectedMonthlyExpense = dailySpendingRate * daysInCurrentMonth;
  
  // Get expense trends by category
  const expensesByCategory: Record<string, number[]> = {};
  
  months.forEach((month, index) => {
    const monthTransactions = groupedByMonth[month];
    
    monthTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        // Extract category from description (first word)
        const category = t.category || t.description.split(" ")[0].toLowerCase();
        
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = Array(months.length).fill(0);
        }
        
        expensesByCategory[category][index] += Math.abs(t.amount);
      });
  });
  
  // Find categories with increasing/decreasing trends
  const categoryTrends = Object.entries(expensesByCategory).map(([category, amounts]) => {
    // Only consider categories with data for at least 2 months
    if (amounts.filter(a => a > 0).length < 2) return null;
    
    // Compare most recent months
    const trend = amounts[0] - amounts[1];
    const percentChange = amounts[1] > 0 ? (trend / amounts[1]) * 100 : 0;
    
    return {
      category, 
      currentAmount: amounts[0],
      previousAmount: amounts[1],
      trend,
      percentChange
    };
  }).filter(Boolean);
  
  // Sort by absolute percent change
  const significantTrends = categoryTrends
    .filter(t => Math.abs(t!.percentChange) > 15) // Only significant changes (>15%)
    .sort((a, b) => Math.abs(b!.percentChange) - Math.abs(a!.percentChange));
    
  // Get top spending categories for current month
  const expensesByCategoryCurrentMonth: Record<string, number> = {};
  currentMonthTransactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      const category = t.category || t.description.split(" ")[0].toLowerCase();
      expensesByCategoryCurrentMonth[category] = (expensesByCategoryCurrentMonth[category] || 0) + Math.abs(t.amount);
    });
    
  // Sort categories by amount
  const topCategories = Object.entries(expensesByCategoryCurrentMonth)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
    
  // Generate intelligent insights
  const insights: InsightItem[] = [];
  
  // Insight: Monthly expense projection
  if (projectedMonthlyExpense > currentMonthIncome && currentMonthIncome > 0) {
    insights.push({
      type: "budget",
      title: "Alerta de Orçamento",
      description: `Com base no ritmo atual de gastos, você deve gastar cerca de R$ ${projectedMonthlyExpense.toFixed(2)} este mês, o que excede sua receita confirmada.`,
      action: `Considere reduzir gastos em R$ ${(projectedMonthlyExpense - currentMonthIncome).toFixed(2)} para equilibrar o orçamento.`,
      impact: "high",
      icon: <Target className="h-5 w-5 text-red-500" />
    });
  }
  
  // Insight: Expense trends
  if (months.length >= 2) {
    if (currentMonthExpenses > lastMonthExpenses * 1.2) {
      insights.push({
        type: "expense",
        title: "Aumento de Despesas",
        description: `Suas despesas aumentaram ${Math.round((currentMonthExpenses / lastMonthExpenses - 1) * 100)}% em relação ao mês passado.`,
        action: "Recomendamos revisar seus gastos recentes para identificar áreas para economizar.",
        impact: "high",
        icon: <TrendingUp className="h-5 w-5 text-red-500" />
      });
    } else if (currentMonthExpenses < lastMonthExpenses * 0.8) {
      insights.push({
        type: "expense",
        title: "Redução de Despesas",
        description: `Suas despesas diminuíram ${Math.round((1 - currentMonthExpenses / lastMonthExpenses) * 100)}% em relação ao mês passado. Excelente trabalho!`,
        impact: "low",
        icon: <TrendingDown className="h-5 w-5 text-green-500" />
      });
    }
  }
  
  // Insight: Income trends
  if (months.length >= 2) {
    if (currentMonthIncome < lastMonthIncome * 0.9 && lastMonthIncome > 0) {
      insights.push({
        type: "income",
        title: "Queda na Receita",
        description: `Sua receita confirmada diminuiu ${Math.round((1 - currentMonthIncome / lastMonthIncome) * 100)}% em relação ao mês passado.`,
        action: "Considere formas de aumentar sua receita ou ajustar seu orçamento.",
        impact: "high",
        icon: <TrendingDown className="h-5 w-5 text-yellow-500" />
      });
    } else if (currentMonthIncome > lastMonthIncome * 1.1) {
      insights.push({
        type: "income",
        title: "Aumento na Receita",
        description: `Sua receita confirmada aumentou ${Math.round((currentMonthIncome / lastMonthIncome - 1) * 100)}% em relação ao mês passado. Parabéns!`,
        action: "Considere aumentar sua taxa de poupança aproveitando este aumento.",
        impact: "low",
        icon: <TrendingUp className="h-5 w-5 text-green-500" />
      });
    }
  }
  
  // Insight: Category spending trends
  if (significantTrends.length > 0) {
    const topTrend = significantTrends[0]!;
    if (topTrend.trend > 0) {
      insights.push({
        type: "trend",
        title: `Aumento em ${topTrend.category}`,
        description: `Seus gastos em ${topTrend.category} aumentaram ${Math.abs(Math.round(topTrend.percentChange))}% em relação ao mês passado.`,
        action: `Considere revisar seus gastos em ${topTrend.category} para identificar oportunidades de economia.`,
        impact: "medium",
        icon: <BarChart4 className="h-5 w-5 text-yellow-500" />
      });
    } else {
      insights.push({
        type: "trend",
        title: `Redução em ${topTrend.category}`,
        description: `Seus gastos em ${topTrend.category} diminuíram ${Math.abs(Math.round(topTrend.percentChange))}% em relação ao mês passado.`,
        impact: "low",
        icon: <BarChart4 className="h-5 w-5 text-green-500" />
      });
    }
  }
  
  // Insight: Top spending category
  if (topCategories.length > 0) {
    insights.push({
      type: "expense",
      title: `Alto gasto em ${topCategories[0][0]}`,
      description: `Você gastou R$ ${topCategories[0][1].toFixed(2)} em ${topCategories[0][0]} este mês, representando ${Math.round((topCategories[0][1] / currentMonthExpenses) * 100)}% das suas despesas totais.`,
      action: "Considere estabelecer um limite mensal para esta categoria.",
      impact: "medium",
      icon: <DollarSign className="h-5 w-5 text-yellow-500" />
    });
  }
  
  // Insight: Savings opportunity
  const savingsRatio = currentMonthIncome > 0 ? (currentMonthIncome - currentMonthExpenses) / currentMonthIncome : 0;
  if (savingsRatio < 0.2 && currentMonthIncome > 0) {
    insights.push({
      type: "savings",
      title: "Oportunidade de Poupança",
      description: `Você está economizando apenas ${Math.round(savingsRatio * 100)}% da sua receita. O ideal é economizar pelo menos 20-30% da receita mensal.`,
      action: "Analise seus gastos não essenciais e estabeleça uma meta de economia mensal.",
      impact: "medium",
      icon: <PiggyBank className="h-5 w-5 text-blue-500" />
    });
  } else if (savingsRatio >= 0.3) {
    insights.push({
      type: "savings",
      title: "Excelente Taxa de Poupança",
      description: `Você está economizando ${Math.round(savingsRatio * 100)}% da sua receita, o que é excelente para o seu futuro financeiro.`,
      action: "Considere investir parte desse dinheiro para que ele trabalhe para você.",
      impact: "low",
      icon: <PiggyBank className="h-5 w-5 text-green-500" />
    });
  }
  
  // Opportunity insight: Identify recurring expenses that could be optimized
  const recurringExpenses = currentMonthTransactions
    .filter(t => t.type === "expense" && t.recurring)
    .reduce((total, t) => total + Math.abs(t.amount), 0);
    
  if (recurringExpenses > currentMonthExpenses * 0.4) {
    insights.push({
      type: "opportunity",
      title: "Otimize despesas recorrentes",
      description: `${Math.round((recurringExpenses / currentMonthExpenses) * 100)}% de suas despesas são recorrentes. Renegociar contratos pode liberar recursos mensalmente.`,
      action: "Revise assinaturas, serviços e contas mensais para identificar possíveis reduções.",
      impact: "medium",
      icon: <AlertCircle className="h-5 w-5 text-blue-500" />
    });
  }
  
  // Add financial health insight if no critical issues
  if (insights.filter(i => i.impact === "high").length === 0) {
    insights.push({
      type: "savings",
      title: "Finanças saudáveis",
      description: "Seus indicadores financeiros principais estão em boa forma! Continue com o bom trabalho de gestão financeira.",
      impact: "low",
      icon: <Lightbulb className="h-5 w-5 text-green-500" />
    });
  }
  
  // Sort insights by impact (high -> medium -> low)
  insights.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
  
  const displayedInsights = expanded ? insights : insights.slice(0, 3);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Insights Financeiros Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Análise baseada em sua atividade financeira de {format(startOfLastMonth, "MMMM", { locale: ptBR })} a {format(currentDate, "MMMM", { locale: ptBR })}.
        </p>
        
        <div className="space-y-4">
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
                {insight.icon || (
                  insight.type === "expense" ? (
                    <TrendingDown className={insight.impact === "high" ? "h-5 w-5 text-red-500" : "h-5 w-5 text-yellow-500"} />
                  ) : insight.type === "income" ? (
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                  )
                )}
                <div className="flex-1">
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
        </div>
        
        {insights.length > 3 && (
          <Button 
            variant="outline" 
            className="w-full mt-2" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ver menos insights" : `Ver mais ${insights.length - 3} insights`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
