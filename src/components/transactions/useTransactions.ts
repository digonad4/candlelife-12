
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/transaction";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useTransactions(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch transactions data
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("transactions")
        .select(`
          *,
          client:clients(name)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (startDate && endDate) {
        query = query
          .gte("date", startDate.toISOString())
          .lte("date", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  // Filter transactions based on search term
  const filteredTransactions = transactions?.filter((transaction) => {
    const clientName = transaction.client?.name || "";
    const description = transaction.description || "";
    const amount = transaction.amount.toString();
    const date = format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const searchLower = searchTerm.toLowerCase();
    
    return (
      clientName.toLowerCase().includes(searchLower) ||
      description.toLowerCase().includes(searchLower) ||
      amount.includes(searchLower) ||
      date.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Group transactions by day
  const transactionsByDay = filteredTransactions.reduce((acc, transaction) => {
    const dateKey = format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const days = Object.entries(transactionsByDay);

  // Calculate summary values
  const totalTransactions = filteredTransactions.length;
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpenses;

  return {
    transactions: filteredTransactions,
    days,
    isLoading,
    searchTerm,
    setSearchTerm,
    totalTransactions,
    totalIncome,
    totalExpenses,
    balance
  };
}
