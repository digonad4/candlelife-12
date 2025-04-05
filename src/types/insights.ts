
import { ReactNode } from "react";

export type Transaction = {
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

export type InsightType = "expense" | "income" | "budget" | "savings" | "trend" | "opportunity";

export interface InsightItem {
  type: InsightType;
  title: string;
  description: string;
  action?: string;
  impact: "high" | "medium" | "low";
  icon?: ReactNode;
}

export interface FinancialData {
  monthlyMetrics: {
    month: string;
    expenses: number;
    income: number;
    pendingIncome: number;
  }[];
  monthlySavingsRates: {
    month: string;
    savingsRate: number;
  }[];
  currentMonthExpenses: number;
  lastMonthExpenses: number;
  currentMonthIncome: number;
  lastMonthIncome: number;
  projectedMonthlyExpense: number;
  remainingDays: number;
  categoryTrends: {
    category: string;
    currentAmount: number;
    previousAmount: number;
    trend: number;
    percentChange: number;
  }[];
  topCategories: [string, number][];
  months: string[];
  currentMonthTxs: Transaction[];
}
