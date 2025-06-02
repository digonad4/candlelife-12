
import { useMemo } from "react";
import { FinancialGoal } from "./useGoals";
import { useFinancialData } from "./useFinancialData";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export interface GoalProgress {
  goal: FinancialGoal;
  current: number;
  target: number;
  percentage: number;
  status: "on_track" | "warning" | "exceeded" | "achieved";
  remainingDays: number;
  projectedFinal: number;
}

export function useGoalProgress(goals: FinancialGoal[]) {
  const { data: transactions = [] } = useFinancialData();
  
  return useMemo(() => {
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const currentDay = currentMonth.getDate();
    const daysInMonth = monthEnd.getDate();
    const remainingDays = daysInMonth - currentDay;

    return goals.map((goal): GoalProgress => {
      // Filter transactions for current month
      const monthlyTransactions = transactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
      });

      let current = 0;
      
      switch (goal.goal_type) {
        case "expense_limit":
          if (goal.category) {
            current = monthlyTransactions
              .filter(t => t.type === "expense" && t.category?.toLowerCase() === goal.category?.toLowerCase())
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          } else {
            current = monthlyTransactions
              .filter(t => t.type === "expense")
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          }
          break;
          
        case "total_expense_limit":
          current = monthlyTransactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          break;
          
        case "income_target":
          current = monthlyTransactions
            .filter(t => t.type === "income" && t.payment_status === "confirmed")
            .reduce((sum, t) => sum + t.amount, 0);
          break;
          
        case "savings_target":
          const income = monthlyTransactions
            .filter(t => t.type === "income" && t.payment_status === "confirmed")
            .reduce((sum, t) => sum + t.amount, 0);
          const expenses = monthlyTransactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          current = income - expenses;
          break;
      }

      const percentage = goal.amount > 0 ? (current / goal.amount) * 100 : 0;
      
      // Project final value based on current daily rate
      const dailyRate = current / currentDay;
      const projectedFinal = dailyRate * daysInMonth;
      
      // Determine status
      let status: GoalProgress["status"];
      if (goal.goal_type === "expense_limit" || goal.goal_type === "total_expense_limit") {
        if (percentage >= 100) status = "exceeded";
        else if (percentage >= 80) status = "warning";
        else status = "on_track";
      } else {
        if (percentage >= 100) status = "achieved";
        else if (percentage >= 80) status = "on_track";
        else status = "warning";
      }

      return {
        goal,
        current,
        target: goal.amount,
        percentage: Math.min(percentage, 999), // Cap at 999% for display
        status,
        remainingDays,
        projectedFinal,
      };
    });
  }, [goals, transactions]);
}
