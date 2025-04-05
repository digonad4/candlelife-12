
import { 
  TrendingDown, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  PiggyBank, 
  Target, 
  DollarSign, 
  BarChart2,
} from "lucide-react";
import { formatCurrency } from "@/utils/financialUtils";
import { FinancialData, InsightItem } from "@/types/insights";

export function generateInsights(financialData: FinancialData): InsightItem[] {
  const insights: InsightItem[] = [];
  
  const {
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

  // 1. Projeção de orçamento
  if (projectedMonthlyExpense > currentMonthIncome && currentMonthIncome > 0) {
    insights.push({
      type: "budget",
      title: "Alerta de Orçamento",
      description: `Sua projeção de gastos para este mês é de ${formatCurrency(projectedMonthlyExpense)}, excedendo sua renda atual em ${formatCurrency(projectedMonthlyExpense - currentMonthIncome)}.`,
      action: `Reduza ${formatCurrency((projectedMonthlyExpense - currentMonthIncome) / remainingDays)} por dia nos próximos ${remainingDays} dias para manter o equilíbrio.`,
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
        title: "Aumento Significativo nas Despesas",
        description: `Seus gastos aumentaram ${percentIncrease}% comparado ao mês anterior (${formatCurrency(currentMonthExpenses)} vs ${formatCurrency(lastMonthExpenses)}).`,
        action: "Identifique categorias com maiores aumentos e estabeleça limites para o próximo mês.",
        impact: "high",
        icon: <TrendingUp className="h-5 w-5 text-red-500" />,
      });
    } else if (currentMonthExpenses < lastMonthExpenses * 0.8) {
      const percentDecrease = Math.round((1 - currentMonthExpenses / lastMonthExpenses) * 100);
      insights.push({
        type: "expense",
        title: "Redução Expressiva de Despesas",
        description: `Seus gastos diminuíram ${percentDecrease}% em relação ao mês anterior (${formatCurrency(currentMonthExpenses)} vs ${formatCurrency(lastMonthExpenses)}).`,
        action: "Continue com esta estratégia e considere direcionar a economia para investimentos.",
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
        description: `Sua renda teve uma queda de ${percentDrop}% comparado ao mês anterior (${formatCurrency(currentMonthIncome)} vs ${formatCurrency(lastMonthIncome)}).`,
        action: "Revise seu orçamento mensal e priorize despesas essenciais até a estabilização da receita.",
        impact: "high",
        icon: <TrendingDown className="h-5 w-5 text-yellow-500" />,
      });
    } else if (currentMonthIncome > lastMonthIncome * 1.1) {
      const percentRise = Math.round((currentMonthIncome / lastMonthIncome - 1) * 100);
      insights.push({
        type: "income",
        title: "Crescimento da Receita",
        description: `Sua renda aumentou ${percentRise}% em relação ao mês anterior (${formatCurrency(currentMonthIncome)} vs ${formatCurrency(lastMonthIncome)}).`,
        action: "Considere direcionar 40-60% deste aumento para poupança ou investimentos de longo prazo.",
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
      title: `${topTrend.trend > 0 ? "Aumento" : "Redução"} na Categoria ${topTrend.category}`,
      description: `Gastos em "${topTrend.category}" ${topTrend.trend > 0 ? "subiram" : "caíram"} ${Math.abs(Math.round(topTrend.percentChange))}% (${formatCurrency(topTrend.currentAmount)} vs ${formatCurrency(topTrend.previousAmount)}).`,
      action: topTrend.trend > 0 ? `Analise os gastos em "${topTrend.category}" e estabeleça um teto mensal de ${formatCurrency(topTrend.previousAmount * 1.1)}.` : `Continue otimizando seus gastos em "${topTrend.category}" para manter esta tendência positiva.`,
      impact: topTrend.trend > 0 ? "medium" : "low",
      icon: <BarChart2 className={`h-5 w-5 ${topTrend.trend > 0 ? "text-yellow-500" : "text-green-500"}`} />,
    });
  }

  // 5. Top categoria de gasto
  if (topCategories.length > 0) {
    const [category, amount] = topCategories[0];
    insights.push({
      type: "expense",
      title: `Concentração de Gastos em ${category}`,
      description: `${formatCurrency(amount)} em "${category}" representa ${Math.round((amount / currentMonthExpenses) * 100)}% do total de suas despesas mensais.`,
      action: `Defina um limite mensal para "${category}" de no máximo ${formatCurrency(amount * 0.85)} para melhor equilíbrio orçamentário.`,
      impact: "medium",
      icon: <DollarSign className="h-5 w-5 text-yellow-500" />,
    });
  }

  // 6. Oportunidade de poupança
  const savingsRatio = currentMonthIncome > 0 ? (currentMonthIncome - currentMonthExpenses) / currentMonthIncome : 0;
  if (savingsRatio < 0.2 && currentMonthIncome > 0) {
    insights.push({
      type: "savings",
      title: "Potencial de Economia Subaproveitado",
      description: `Atualmente você economiza ${Math.round(savingsRatio * 100)}% da sua renda mensal (recomendado: 20-30%).`,
      action: `Aumente sua poupança em ${formatCurrency(currentMonthIncome * 0.2 - (currentMonthIncome - currentMonthExpenses))} identificando despesas não essenciais.`,
      impact: "medium",
      icon: <PiggyBank className="h-5 w-5 text-blue-500" />,
    });
  } else if (savingsRatio >= 0.3) {
    insights.push({
      type: "savings",
      title: "Excelente Taxa de Poupança",
      description: `Você está economizando ${Math.round(savingsRatio * 100)}% da sua renda (${formatCurrency(currentMonthIncome - currentMonthExpenses)}).`,
      action: "Considere diversificar seus investimentos para maximizar o retorno deste capital economizado.",
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
      title: "Otimização de Despesas Recorrentes",
      description: `${Math.round((recurringExpenses / currentMonthExpenses) * 100)}% dos seus gastos são recorrentes (${formatCurrency(recurringExpenses)}).`,
      action: "Renegocie contratos e avalie alternativas mais econômicas para serviços assinados.",
      impact: "medium",
      icon: <AlertCircle className="h-5 w-5 text-blue-500" />,
    });
  }

  // 8. Saúde financeira
  if (insights.filter(i => i.impact === "high").length === 0) {
    insights.push({
      type: "savings",
      title: "Saúde Financeira Estável",
      description: "Seus indicadores financeiros estão equilibrados e dentro dos parâmetros recomendados.",
      action: "Continue monitorando seus gastos e considere aumentar seus investimentos para crescimento patrimonial.",
      impact: "low",
      icon: <Lightbulb className="h-5 w-5 text-green-500" />,
    });
  }

  // Ordenação por impacto
  return insights.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
}
