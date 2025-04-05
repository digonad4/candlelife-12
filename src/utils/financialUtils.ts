
import { subMonths, format, differenceInDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Transaction, FinancialData } from "@/types/insights";

export const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const calculateFinancialData = (transactions: Transaction[]): FinancialData | null => {
  if (!transactions.length) return null;

  const currentDate = new Date();
  const startOfLastMonth = subMonths(currentDate, 1);

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
};
