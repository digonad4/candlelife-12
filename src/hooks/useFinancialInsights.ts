
import { useMemo } from "react";
import { useFinancialData } from "@/hooks/useFinancialData";
import { Transaction } from "@/types/transaction";
import {
  subMonths,
  format,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  parseISO,
  startOfDay,
  differenceInBusinessDays
} from "date-fns";
import { ptBR } from "date-fns/locale";

// Explicit typing for insights
export type InsightType = "expense" | "income" | "budget" | "savings" | "trend" | "opportunity" | "recurring" | "cashflow";
export interface InsightItem {
  type: InsightType;
  title: string;
  description: string;
  action?: string;
  impact: "high" | "medium" | "low";
  icon?: React.ReactNode;
}

export interface FinancialInsightsData {
  monthlyMetrics: Array<{
    month: string;
    expenses: number;
    income: number;
    pendingIncome: number;
    transactionCount: number;
  }>;
  currentMonthExpenses: number;
  lastMonthExpenses: number;
  currentMonthIncome: number;
  lastMonthIncome: number;
  projectedMonthlyExpense: number;
  remainingBusinessDays: number;
  remainingCalendarDays: number;
  categoryTrends: Array<{
    category: string;
    currentAmount: number;
    previousAmount: number;
    trend: number;
    percentChange: number;
    significant: boolean;
  }>;
  topCategories: Array<[string, number]>;
  currentMonthTxs: Transaction[];
  paymentMethodDistribution: {
    cash: number;
    pix: number;
    credit: number;
    debit: number;
  };
  highestSpendingDay: number;
  dayOfWeekSpending: Record<number, number>;
  recurringExpenses: number;
  recurringExpensesRatio: number;
  dailySpendingRate: number;
  elapsedBusinessDays: number;
  months: string[];
}

export function useFinancialInsights(months: number = 3) {
  const currentDate = useMemo(() => new Date(), []);
  const lastMonth = subMonths(currentDate, 1);
  
  // Use our custom hook to fetch financial data
  const { data: transactions = [], isLoading } = useFinancialData(months);
  
  // Heavy computation memoization
  const financialData = useMemo<FinancialInsightsData | null>(() => {
    if (!transactions || transactions.length === 0) return null;

    // Group by month for better analysis
    const groupedByMonth: Record<string, Transaction[]> = {};
    const today = startOfDay(currentDate);
    const dayOfMonth = currentDate.getDate();
    
    transactions.forEach(t => {
      const date = parseISO(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = [];
      }
      
      groupedByMonth[monthKey].push(t);
    });

    // Important! Define months variable here so it's available for the whole function
    const monthsArray = Object.keys(groupedByMonth).sort().reverse();
    
    const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
    const lastMonthKey = `${lastMonth.getFullYear()}-${lastMonth.getMonth() + 1}`;
    
    const currentMonthTxs = groupedByMonth[currentMonthKey] || [];
    const lastMonthTxs = groupedByMonth[lastMonthKey] || [];
    
    // Get transactions up to today for accurate daily rate calculation
    const currentMonthToDateTxs = currentMonthTxs.filter(t => {
      const txDate = parseISO(t.date);
      return txDate <= today;
    });

    // Monthly metrics calculation
    const monthlyMetrics = monthsArray.map(month => {
      const txs = groupedByMonth[month];
      const confirmedExpenses = txs.filter(t => t.type === "expense" && t.payment_status === "confirmed");
      const confirmedIncome = txs.filter(t => t.type === "income" && t.payment_status === "confirmed");
      
      return {
        month,
        expenses: confirmedExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        income: confirmedIncome.reduce((sum, t) => sum + t.amount, 0),
        pendingIncome: txs.filter(t => t.type === "income" && t.payment_status !== "confirmed")
          .reduce((sum, t) => sum + t.amount, 0),
        transactionCount: txs.length,
      };
    });
    
    // Calculate current month expenses and income
    const currentMonthExpenses = currentMonthTxs
      .filter(t => t.type === "expense" && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const currentMonthIncome = currentMonthTxs
      .filter(t => t.type === "income" && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Last month metrics  
    const lastMonthExpenses = lastMonthTxs
      .filter(t => t.type === "expense" && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const lastMonthIncome = lastMonthTxs
      .filter(t => t.type === "income" && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate business days for better daily rate projections
    const daysInCurrentMonth = differenceInDays(
      endOfMonth(currentDate), 
      startOfMonth(currentDate)
    ) + 1;
    
    const businessDaysInMonth = differenceInBusinessDays(
      endOfMonth(currentDate),
      startOfMonth(currentDate)
    ) + 1;
    
    const elapsedBusinessDays = differenceInBusinessDays(
      currentDate,
      startOfMonth(currentDate)
    ) + 1;
    
    const remainingBusinessDays = businessDaysInMonth - elapsedBusinessDays;
    const remainingCalendarDays = daysInCurrentMonth - dayOfMonth;

    // More accurate spending rate based on business days for expenses
    const dailySpendingRate = currentMonthToDateTxs
      .filter(t => t.type === "expense" && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) / elapsedBusinessDays;
    
    // Calculate projected expenses more accurately
    const projectedMonthlyExpense = currentMonthExpenses + (dailySpendingRate * remainingBusinessDays);

    // Category-based analysis
    const expensesByCategory: Record<string, number[]> = {};
    monthsArray.forEach((month, idx) => {
      const monthTransactions = groupedByMonth[month] || [];
      monthTransactions
        .filter(t => t.type === "expense" && t.payment_status === "confirmed")
        .forEach(t => {
          const category = t.category || "Outros";
          if (!expensesByCategory[category]) {
            expensesByCategory[category] = Array(monthsArray.length).fill(0);
          }
          expensesByCategory[category][idx] += Math.abs(t.amount);
        });
    });

    // Analyze spending trends by category
    const categoryTrends = Object.entries(expensesByCategory)
      .map(([category, amounts]) => {
        // Skip categories with insufficient data
        if (amounts.filter(a => a > 0).length < 2) return null;
        
        const currentAmount = amounts[0] || 0;
        const previousAmount = amounts[1] || 0;
        
        // Skip categories with very small amounts
        if (currentAmount < 10 && previousAmount < 10) return null;
        
        const trend = currentAmount - previousAmount;
        const percentChange = previousAmount > 0 ? (trend / previousAmount) * 100 : 0;
        
        return { 
          category, 
          currentAmount, 
          previousAmount, 
          trend, 
          percentChange,
          significant: Math.abs(percentChange) > 15 && Math.abs(trend) > 50
        };
      })
      .filter(Boolean)
      .filter(t => t?.significant)
      .sort((a, b) => Math.abs(b!.percentChange) - Math.abs(a!.percentChange)) as {
        category: string;
        currentAmount: number;
        previousAmount: number;
        trend: number;
        percentChange: number;
        significant: boolean;
      }[];

    // Payment method distribution
    const paymentMethodDistribution = {
      cash: currentMonthTxs
        .filter(t => t.payment_method === "cash" && t.payment_status === "confirmed")
        .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -Math.abs(t.amount)), 0),
      pix: currentMonthTxs
        .filter(t => t.payment_method === "pix" && t.payment_status === "confirmed")
        .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -Math.abs(t.amount)), 0),
      credit: currentMonthTxs
        .filter(t => t.payment_method === "credit_card" && t.payment_status === "confirmed")
        .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -Math.abs(t.amount)), 0),
      debit: currentMonthTxs
        .filter(t => t.payment_method === "debit_card" && t.payment_status === "confirmed")
        .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -Math.abs(t.amount)), 0),
    };

    // Current month top expense categories
    const expensesByCategoryCurrent: Record<string, number> = {};
    currentMonthTxs
      .filter(t => t.type === "expense" && t.payment_status === "confirmed")
      .forEach(t => {
        const category = t.category || "Outros";
        expensesByCategoryCurrent[category] = (expensesByCategoryCurrent[category] || 0) + Math.abs(t.amount);
      });
    
    const topCategories = Object.entries(expensesByCategoryCurrent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
      
    // Weekly spending pattern
    const dayOfWeekSpending: Record<number, number> = {};
    currentMonthTxs
      .filter(t => t.type === "expense" && t.payment_status === "confirmed")
      .forEach(t => {
        const date = parseISO(t.date);
        const dayOfWeek = date.getDay();
        dayOfWeekSpending[dayOfWeek] = (dayOfWeekSpending[dayOfWeek] || 0) + Math.abs(t.amount);
      });
      
    // Find day with highest spending
    let highestSpendingDay = -1;
    let highestAmount = 0;
    Object.entries(dayOfWeekSpending).forEach(([day, amount]) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestSpendingDay = parseInt(day);
      }
    });
    
    // Calculate recurring expenses
    const recurringExpenses = currentMonthTxs
      .filter(t => t.type === "expense" && t.recurring === true && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const recurringExpensesRatio = currentMonthExpenses > 0 
      ? recurringExpenses / currentMonthExpenses 
      : 0;

    return {
      monthlyMetrics,
      currentMonthExpenses,
      lastMonthExpenses,
      currentMonthIncome,
      lastMonthIncome,
      projectedMonthlyExpense,
      remainingBusinessDays,
      remainingCalendarDays,
      categoryTrends,
      topCategories,
      currentMonthTxs,
      paymentMethodDistribution,
      highestSpendingDay,
      dayOfWeekSpending,
      recurringExpenses,
      recurringExpensesRatio,
      dailySpendingRate,
      elapsedBusinessDays,
      months: monthsArray
    };
  }, [transactions, currentDate, lastMonth]);

  // Generate insights based on financial data
  const insights = useMemo(() => {
    if (!financialData) return [];
    
    const formatCurrency = (value: number) =>
      `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      
    const dayOfWeekName = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const insights: InsightItem[] = [];
    
    const {
      currentMonthExpenses,
      lastMonthExpenses,
      currentMonthIncome,
      lastMonthIncome,
      projectedMonthlyExpense,
      remainingBusinessDays,
      remainingCalendarDays,
      categoryTrends,
      topCategories,
      paymentMethodDistribution,
      highestSpendingDay,
      recurringExpenses,
      recurringExpensesRatio,
      dailySpendingRate,
      elapsedBusinessDays,
      months
    } = financialData;

    // 1. Budget projection with more accurate daily rates
    if (projectedMonthlyExpense > 0) {
      if (projectedMonthlyExpense > currentMonthIncome && currentMonthIncome > 0) {
        const deficit = projectedMonthlyExpense - currentMonthIncome;
        insights.push({
          type: "budget",
          title: "Alerta de Orçamento",
          description: `Sua projeção de gastos para este mês é de ${formatCurrency(projectedMonthlyExpense)}, excedendo sua renda em ${formatCurrency(deficit)}.`,
          action: `Reduza seus gastos em ${formatCurrency(deficit / remainingCalendarDays)} por dia nos próximos ${remainingCalendarDays} dias para equilibrar o orçamento.`,
          impact: "high"
        });
      } else if (projectedMonthlyExpense > currentMonthIncome * 0.9 && currentMonthIncome > 0) {
        insights.push({
          type: "budget",
          title: "Orçamento Apertado",
          description: `Sua projeção de gastos (${formatCurrency(projectedMonthlyExpense)}) está se aproximando da sua renda (${formatCurrency(currentMonthIncome)}).`,
          action: `Considere reduzir despesas em ${formatCurrency(projectedMonthlyExpense - (currentMonthIncome * 0.8))} para manter uma margem segura.`,
          impact: "medium"
        });
      } else if (currentMonthIncome > 0) {
        insights.push({
          type: "budget",
          title: "Orçamento Equilibrado",
          description: `Você está gastando de forma sustentável este mês, com uma projeção de ${formatCurrency(projectedMonthlyExpense)} (${Math.round((projectedMonthlyExpense / currentMonthIncome) * 100)}% da sua renda).`,
          impact: "low"
        });
      }
    }

    // 2. Daily spending insights
    if (dailySpendingRate > 0) {
      insights.push({
        type: "expense",
        title: "Gastos Diários",
        description: `Você gasta em média ${formatCurrency(dailySpendingRate)} por dia útil (baseado nos últimos ${elapsedBusinessDays} dias úteis).`,
        action: elapsedBusinessDays >= 5 ? 
          `Tentar reduzir para ${formatCurrency(dailySpendingRate * 0.9)} pode economizar ${formatCurrency(dailySpendingRate * 0.1 * remainingBusinessDays)} até o fim do mês.` : 
          undefined,
        impact: "medium"
      });
    }

    // 3. Month-over-month expense trend
    if (lastMonthExpenses > 0 && months.length >= 2) {
      if (currentMonthExpenses > lastMonthExpenses * 1.2) {
        const percentIncrease = Math.round((currentMonthExpenses / lastMonthExpenses - 1) * 100);
        insights.push({
          type: "expense",
          title: "Aumento de Despesas",
          description: `Seus gastos subiram ${percentIncrease}% em relação ao mês anterior (${formatCurrency(currentMonthExpenses)} vs ${formatCurrency(lastMonthExpenses)}).`,
          action: "Identifique quais categorias tiveram maior aumento e avalie oportunidades de redução.",
          impact: "high"
        });
      } else if (currentMonthExpenses < lastMonthExpenses * 0.8) {
        const percentDecrease = Math.round((1 - currentMonthExpenses / lastMonthExpenses) * 100);
        insights.push({
          type: "expense",
          title: "Redução de Despesas",
          description: `Seus gastos caíram ${percentDecrease}% em relação ao mês anterior (${formatCurrency(currentMonthExpenses)} vs ${formatCurrency(lastMonthExpenses)}).`,
          action: "Continue com o bom trabalho! Mantenha este padrão de economia.",
          impact: "low"
        });
      }
    }

    // 4. Income trend
    if (months.length >= 2 && lastMonthIncome > 0) {
      if (currentMonthIncome < lastMonthIncome * 0.9) {
        const percentDrop = Math.round((1 - currentMonthIncome / lastMonthIncome) * 100);
        insights.push({
          type: "income",
          title: "Queda na Receita",
          description: `Sua renda caiu ${percentDrop}% em relação ao mês anterior (${formatCurrency(currentMonthIncome)} vs ${formatCurrency(lastMonthIncome)}).`,
          action: "Revise seu orçamento para se ajustar à nova realidade financeira ou busque fontes adicionais de renda.",
          impact: "high"
        });
      } else if (currentMonthIncome > lastMonthIncome * 1.1) {
        const percentRise = Math.round((currentMonthIncome / lastMonthIncome - 1) * 100);
        insights.push({
          type: "income",
          title: "Aumento na Receita",
          description: `Sua renda aumentou ${percentRise}% em relação ao mês anterior (${formatCurrency(currentMonthIncome)} vs ${formatCurrency(lastMonthIncome)}).`,
          action: "Considere direcionar este adicional para investimentos ou para sua reserva de emergência.",
          impact: "low"
        });
      }
    }

    // 5. Category-specific trends
    if (categoryTrends.length > 0) {
      const topTrend = categoryTrends[0];
      const percentChange = Math.abs(Math.round(topTrend.percentChange));
      
      insights.push({
        type: "trend",
        title: `${topTrend.trend > 0 ? "Aumento" : "Redução"} em ${topTrend.category}`,
        description: `Gastos em ${topTrend.category} ${topTrend.trend > 0 ? "subiram" : "caíram"} ${percentChange}% (${formatCurrency(topTrend.currentAmount)} vs ${formatCurrency(topTrend.previousAmount)}).`,
        action: topTrend.trend > 0 ? `Analise seus gastos em ${topTrend.category} para identificar oportunidades de economia.` : undefined,
        impact: topTrend.trend > 0 ? "medium" : "low"
      });
    }

    // Add remaining insight generator logic
    // 6. Top spending category
    if (topCategories.length > 0) {
      const [category, amount] = topCategories[0];
      const categoryPercentage = Math.round((amount / currentMonthExpenses) * 100);
      
      insights.push({
        type: "expense",
        title: `Principal Gasto: ${category}`,
        description: `${formatCurrency(amount)} em ${category} (${categoryPercentage}% de suas despesas).`,
        action: categoryPercentage > 30 ? 
          `Considere estabelecer um limite mensal para ${category} e explorar alternativas mais econômicas.` : 
          `Monitore seus gastos em ${category} para mantê-los sob controle.`,
        impact: categoryPercentage > 30 ? "medium" : "low"
      });
    }

    // 7. Payment method insights
    const totalCashFlow = Object.values(paymentMethodDistribution).reduce((sum, val) => sum + Math.abs(val), 0);
    if (totalCashFlow > 0) {
      const mostUsedMethod = Object.entries(paymentMethodDistribution)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
        
      const methodName = {
        cash: "dinheiro",
        pix: "PIX",
        credit: "cartão de crédito",
        debit: "cartão de débito"
      }[mostUsedMethod[0]] || mostUsedMethod[0];
      
      const methodPercentage = Math.round((Math.abs(mostUsedMethod[1]) / totalCashFlow) * 100);
      
      if (methodPercentage > 50) {
        insights.push({
          type: "cashflow",
          title: `Preferência por ${methodName.charAt(0).toUpperCase() + methodName.slice(1)}`,
          description: `${methodPercentage}% do seu fluxo financeiro usa ${methodName}.`,
          action: mostUsedMethod[0] === "credit" ? 
            "Monitore o uso de crédito para evitar acúmulo de dívidas e juros." : 
            `Diversificar métodos de pagamento pode ajudar no controle financeiro.`,
          impact: mostUsedMethod[0] === "credit" ? "medium" : "low"
        });
      }
    }

    // 8. Day of week spending pattern
    if (highestSpendingDay !== -1) {
      insights.push({
        type: "expense",
        title: `Gastos Maiores às ${dayOfWeekName[highestSpendingDay]}s`,
        description: `Você tende a gastar mais às ${dayOfWeekName[highestSpendingDay]}s.`,
        action: "Planeje com antecedência para reduzir gastos impulsivos neste dia da semana.",
        impact: "medium"
      });
    }

    // 9. Recurring expenses
    if (recurringExpensesRatio > 0.4 && recurringExpenses > 0) {
      insights.push({
        type: "recurring",
        title: "Otimização de Despesas Fixas",
        description: `${Math.round(recurringExpensesRatio * 100)}% dos seus gastos são recorrentes (${formatCurrency(recurringExpenses)}).`,
        action: "Revise suas assinaturas e despesas fixas para identificar serviços que podem ser reduzidos ou cancelados.",
        impact: "medium"
      });
    }

    // 10. Savings opportunity
    const savingsRatio = currentMonthIncome > 0 ? (currentMonthIncome - currentMonthExpenses) / currentMonthIncome : 0;
    if (savingsRatio < 0.2 && currentMonthIncome > 0) {
      insights.push({
        type: "savings",
        title: "Oportunidade de Poupança",
        description: `Você economiza apenas ${Math.round(savingsRatio * 100)}% da sua renda (recomendado: 20%).`,
        action: `Tente economizar mais ${formatCurrency(currentMonthIncome * 0.2 - (currentMonthIncome - currentMonthExpenses))} por mês para construir uma reserva financeira.`,
        impact: "medium"
      });
    } else if (savingsRatio >= 0.3) {
      insights.push({
        type: "savings",
        title: "Excelente Taxa de Poupança",
        description: `Você economiza ${Math.round(savingsRatio * 100)}% da sua renda (${formatCurrency(currentMonthIncome - currentMonthExpenses)}).`,
        action: "Considere investir esse excedente para fazer seu dinheiro trabalhar para você.",
        impact: "low"
      });
    }

    // 11. Overall financial health
    if (insights.filter(i => i.impact === "high").length === 0) {
      insights.push({
        type: "savings",
        title: "Saúde Financeira Positiva",
        description: "Seus indicadores financeiros estão equilibrados. Continue com o bom trabalho!",
        action: "Considere estabelecer metas financeiras de longo prazo para aumentar seu patrimônio.",
        impact: "low"
      });
    }

    // Sort insights by impact (high to low)
    return insights.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }, [financialData]);

  return {
    financialData,
    insights,
    isLoading,
    currentDate,
    lastMonth,
  };
}
