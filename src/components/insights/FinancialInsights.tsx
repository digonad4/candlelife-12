import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingDown, TrendingUp, AlertCircle, Lightbulb, PiggyBank, Target, DollarSign, BarChart2 } from "lucide-react";
import { subMonths, format, differenceInDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../ui/button";
import { useState, useMemo } from "react";

// Tipagem explícita
type Transaction = {
  id: string;
  user_id: string;
  type: "expense" | "income";
  amount: number;
  date: string;
  description: string;
  category?: string;
  payment_status?: "confirmed" | "pending" | "failed";
  recurring?: boolean;
};

type InsightType = "expense" | "income" | "budget" | "savings" | "trend" | "opportunity";
interface InsightItem {
  type: InsightType;
  title: string;
  description: string;
  action?: string;
  impact: "high" | "medium" | "low";
  icon?: React.ReactNode;
}

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinancialInsights() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const currentDate = useMemo(() => new Date(), []);
  const startOfLastMonth = subMonths(currentDate, 1);

  // Fetch de transações com cache
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
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
      return data.map((transaction) => ({
        ...transaction,
        type: transaction.type as "expense" | "income",
        payment_status: transaction.payment_status as "confirmed" | "pending" | "failed" | undefined,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  // Memoização para cálculos pesados
  const financialData = useMemo(() => {
    if (!transactions.length) return null;

    // Agrupamento por mês
    const groupedByMonth: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const date = parseISO(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      groupedByMonth[monthKey] = groupedByMonth[monthKey] || [];
      groupedByMonth[monthKey].push(t);
    });

    const months = Object.keys(groupedByMonth).sort().reverse();
    const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
    const lastMonthKey = `${startOfLastMonth.getFullYear()}-${startOfLastMonth.getMonth() + 1}`;

    const currentMonthTxs = groupedByMonth[currentMonthKey] || [];
    const lastMonthTxs = groupedByMonth[lastMonthKey] || [];

    // Métricas mensais
    const monthlyMetrics = months.map(month => {
      const txs = groupedByMonth[month];
      return {
        month,
        expenses: txs.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0),
        income: txs.filter(t => t.type === "income" && t.payment_status === "confirmed").reduce((sum, t) => sum + t.amount, 0),
        pendingIncome: txs.filter(t => t.type === "income" && t.payment_status !== "confirmed").reduce((sum, t) => sum + t.amount, 0),
      };
    });

    // Cálculos de despesas e receitas
    const currentMonthExpenses = currentMonthTxs.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const lastMonthExpenses = lastMonthTxs.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const currentMonthIncome = currentMonthTxs.filter(t => t.type === "income" && t.payment_status === "confirmed").reduce((sum, t) => sum + t.amount, 0);
    const lastMonthIncome = lastMonthTxs.filter(t => t.type === "income" && t.payment_status === "confirmed").reduce((sum, t) => sum + t.amount, 0);

    // Taxa de poupança mensal
    const monthlySavingsRates = monthlyMetrics.map(({ month, income, expenses }) => ({
      month,
      savingsRate: income > 0 ? (income - expenses) / income : 0,
    }));

    // Projeção diária
    const daysInCurrentMonth = differenceInDays(endOfMonth(currentDate), startOfMonth(currentDate)) + 1;
    const currentDayOfMonth = currentDate.getDate();
    const remainingDays = daysInCurrentMonth - currentDayOfMonth;
    const dailySpendingRate = currentMonthExpenses / currentDayOfMonth;
    const projectedMonthlyExpense = dailySpendingRate * daysInCurrentMonth;

    // Tendências por categoria
    const expensesByCategory: Record<string, number[]> = {};
    months.forEach((month, idx) => {
      groupedByMonth[month].filter(t => t.type === "expense").forEach(t => {
        const category = (t.category || t.description.split(" ")[0]).toLowerCase();
        expensesByCategory[category] = expensesByCategory[category] || Array(months.length).fill(0);
        expensesByCategory[category][idx] += Math.abs(t.amount);
      });
    });

    const categoryTrends = Object.entries(expensesByCategory)
      .map(([category, amounts]) => {
        if (amounts.filter(a => a > 0).length < 2) return null;
        const trend = amounts[0] - amounts[1];
        const percentChange = amounts[1] > 0 ? (trend / amounts[1]) * 100 : 0;
        return { category, currentAmount: amounts[0], previousAmount: amounts[1], trend, percentChange };
      })
      .filter(Boolean)
      .filter(t => Math.abs(t!.percentChange) > 15)
      .sort((a, b) => Math.abs(b!.percentChange) - Math.abs(a!.percentChange)) as {
        category: string;
        currentAmount: number;
        previousAmount: number;
        trend: number;
        percentChange: number;
      }[];

    // Top categorias do mês atual
    const expensesByCategoryCurrent: Record<string, number> = {};
    currentMonthTxs.filter(t => t.type === "expense").forEach(t => {
      const category = (t.category || t.description.split(" ")[0]).toLowerCase();
      expensesByCategoryCurrent[category] = (expensesByCategoryCurrent[category] || 0) + Math.abs(t.amount);
    });
    const topCategories = Object.entries(expensesByCategoryCurrent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      monthlyMetrics,
      monthlySavingsRates,
      currentMonthExpenses,
      lastMonthExpenses,
      currentMonthIncome,
      lastMonthIncome,
      projectedMonthlyExpense,
      remainingDays,
      categoryTrends,
      topCategories,
      months,
      currentMonthTxs,
    };
  }, [transactions, currentDate, startOfLastMonth]);

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

  const {
    monthlyMetrics,
    monthlySavingsRates,
    currentMonthExpenses,
    lastMonthExpenses,
    currentMonthIncome,
    lastMonthIncome,
    projectedMonthlyExpense,
    remainingDays,
    categoryTrends,
    topCategories,
    months,
    currentMonthTxs,
  } = financialData;

  // Geração de insights
  const insights: InsightItem[] = [];

  // 1. Projeção de orçamento
  if (projectedMonthlyExpense > currentMonthIncome && currentMonthIncome > 0) {
    insights.push({
      type: "budget",
      title: "Alerta de Orçamento",
      description: `Sua projeção de gastos é ${formatCurrency(projectedMonthlyExpense)}, excedendo sua renda em ${formatCurrency(projectedMonthlyExpense - currentMonthIncome)}.`,
      action: `Reduza ${formatCurrency((projectedMonthlyExpense - currentMonthIncome) / remainingDays)} por dia nos próximos ${remainingDays} dias.`,
      impact: "high",
      icon: <Target className="h-5 w-5 text-red-500" />,
    });
  }

  // 2. Tendência de despesas
  if (months.length >= 2) {
    if (currentMonthExpenses > lastMonthExpenses * 1.2) {
      const percentIncrease = Math.round((currentMonthExpenses / lastMonthExpenses - 1) * 100);
      insights.push({
        type: "expense",
        title: "Aumento de Despesas",
        description: `Seus gastos subiram ${percentIncrease}% (${formatCurrency(currentMonthExpenses)} vs ${formatCurrency(lastMonthExpenses)}).`,
        action: "Revise suas despesas para encontrar áreas de economia.",
        impact: "high",
        icon: <TrendingUp className="h-5 w-5 text-red-500" />,
      });
    } else if (currentMonthExpenses < lastMonthExpenses * 0.8) {
      const percentDecrease = Math.round((1 - currentMonthExpenses / lastMonthExpenses) * 100);
      insights.push({
        type: "expense",
        title: "Redução de Despesas",
        description: `Seus gastos caíram ${percentDecrease}% (${formatCurrency(currentMonthExpenses)} vs ${formatCurrency(lastMonthExpenses)}).`,
        impact: "low",
        icon: <TrendingDown className="h-5 w-5 text-green-500" />,
      });
    }
  }

  // 3. Tendência de receita
  if (months.length >= 2) {
    if (currentMonthIncome < lastMonthIncome * 0.9 && lastMonthIncome > 0) {
      const percentDrop = Math.round((1 - currentMonthIncome / lastMonthIncome) * 100);
      insights.push({
        type: "income",
        title: "Queda na Receita",
        description: `Sua renda caiu ${percentDrop}% (${formatCurrency(currentMonthIncome)} vs ${formatCurrency(lastMonthIncome)}).`,
        action: "Considere ajustar seu orçamento ou buscar novas fontes de renda.",
        impact: "high",
        icon: <TrendingDown className="h-5 w-5 text-yellow-500" />,
      });
    } else if (currentMonthIncome > lastMonthIncome * 1.1) {
      const percentRise = Math.round((currentMonthIncome / lastMonthIncome - 1) * 100);
      insights.push({
        type: "income",
        title: "Aumento na Receita",
        description: `Sua renda subiu ${percentRise}% (${formatCurrency(currentMonthIncome)} vs ${formatCurrency(lastMonthIncome)}).`,
        action: "Aproveite para aumentar sua poupança ou investimentos.",
        impact: "low",
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      });
    }
  }

  // 4. Tendência por categoria
  if (categoryTrends.length > 0) {
    const topTrend = categoryTrends[0];
    insights.push({
      type: "trend",
      title: `${topTrend.trend > 0 ? "Aumento" : "Redução"} em ${topTrend.category}`,
      description: `Gastos em ${topTrend.category} ${topTrend.trend > 0 ? "subiram" : "caíram"} ${Math.abs(Math.round(topTrend.percentChange))}% (${formatCurrency(topTrend.currentAmount)} vs ${formatCurrency(topTrend.previousAmount)}).`,
      action: topTrend.trend > 0 ? `Analise se os gastos em ${topTrend.category} podem ser reduzidos.` : undefined,
      impact: topTrend.trend > 0 ? "medium" : "low",
      icon: <BarChart2 className={`h-5 w-5 ${topTrend.trend > 0 ? "text-yellow-500" : "text-green-500"}`} />,
    });
  }

  // 5. Top categoria de gasto
  if (topCategories.length > 0) {
    const [category, amount] = topCategories[0];
    insights.push({
      type: "expense",
      title: `Alto Gasto em ${category}`,
      description: `${formatCurrency(amount)} em ${category} (${Math.round((amount / currentMonthExpenses) * 100)}% das despesas).`,
      action: `Defina um limite mensal para ${category}.`,
      impact: "medium",
      icon: <DollarSign className="h-5 w-5 text-yellow-500" />,
    });
  }

  // 6. Oportunidade de poupança
  const savingsRatio = currentMonthIncome > 0 ? (currentMonthIncome - currentMonthExpenses) / currentMonthIncome : 0;
  if (savingsRatio < 0.2 && currentMonthIncome > 0) {
    insights.push({
      type: "savings",
      title: "Oportunidade de Poupança",
      description: `Você economiza ${Math.round(savingsRatio * 100)}% da renda (ideal: 20-30%).`,
      action: `Tente economizar mais ${formatCurrency(currentMonthIncome * 0.2 - (currentMonthIncome - currentMonthExpenses))}.`,
      impact: "medium",
      icon: <PiggyBank className="h-5 w-5 text-blue-500" />,
    });
  } else if (savingsRatio >= 0.3) {
    insights.push({
      type: "savings",
      title: "Excelente Poupança",
      description: `Taxa de ${Math.round(savingsRatio * 100)}% (${formatCurrency(currentMonthIncome - currentMonthExpenses)}).`,
      action: "Considere investir esse excedente.",
      impact: "low",
      icon: <PiggyBank className="h-5 w-5 text-green-500" />,
    });
  }

  // 7. Despesas recorrentes
  const recurringExpenses = currentMonthTxs
    .filter(t => t.type === "expense" && t.recurring)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  if (recurringExpenses > currentMonthExpenses * 0.4) {
    insights.push({
      type: "opportunity",
      title: "Otimizar Recorrências",
      description: `${Math.round((recurringExpenses / currentMonthExpenses) * 100)}% das despesas são recorrentes (${formatCurrency(recurringExpenses)}).`,
      action: "Revise assinaturas e contratos para economizar.",
      impact: "medium",
      icon: <AlertCircle className="h-5 w-5 text-blue-500" />,
    });
  }

  // 8. Saúde financeira
  if (insights.filter(i => i.impact === "high").length === 0) {
    insights.push({
      type: "savings",
      title: "Finanças Saudáveis",
      description: "Seus indicadores estão equilibrados. Continue assim!",
      impact: "low",
      icon: <Lightbulb className="h-5 w-5 text-green-500" />,
    });
  }

  // Ordenação por impacto
  const sortedInsights = insights.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
  const displayedInsights = expanded ? sortedInsights : sortedInsights.slice(0, 3);

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
          Análise de {format(startOfLastMonth, "MMMM", { locale: ptBR })} a {format(currentDate, "MMMM", { locale: ptBR })}.
        </p>
        <div className="space-y-4">
          {displayedInsights.map((insight, idx) => (
            <Alert
              key={idx}
              className={
                insight.impact === "high"
                  ? "border-l-4 border-l-red-500"
                  : insight.impact === "medium"
                  ? "border-l-4 border-l-yellow-500"
                  : "border-l-4 border-l-green-500"
              }
            >
              <div className="flex items-start gap-3">
                {insight.icon || <AlertCircle className="h-5 w-5 text-blue-500" />}
                <div className="flex-1">
                  <AlertTitle className="font-semibold">{insight.title}</AlertTitle>
                  <AlertDescription className="mt-1">
                    {insight.description}
                    {insight.action && <p className="mt-2 font-medium text-primary">{insight.action}</p>}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
        {insights.length > 3 && (
          <Button variant="outline" className="w-full mt-2" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Ver menos" : `Ver mais ${insights.length - 3} insights`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}