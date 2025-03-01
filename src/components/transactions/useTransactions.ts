
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { DateRange, Transaction, TransactionSummary } from "./types";

export const useTransactions = (dateRange: DateRange) => {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["recent-transactions", user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*, client:clients(name)")
        .eq("user_id", user.id)
        .gte("date", `${dateRange.start}T00:00:00.000Z`)
        .lte("date", `${dateRange.end}T23:59:59.999Z`)
        .order("payment_status", { ascending: false })
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!user,
  });

  const totals = useMemo<TransactionSummary>(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalDinheiro: 0,
        totalPix: 0,
        totalFaturado: 0,
        totalLucros: 0,
        totalGastos: 0,
        totalPendentes: 0,
        totalAcumulado: 0,
      };
    }

    const totalDinheiro = transactions
      .filter((t) => t.payment_method === "cash" && t.payment_status === "confirmed" && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPix = transactions
      .filter((t) => t.payment_method === "pix" && t.payment_status === "confirmed" && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalFaturado = transactions
      .filter((t) => t.payment_method === "invoice" && t.payment_status === "confirmed" && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalLucros = transactions
      .filter((t) => t.type === "income" && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalGastos = transactions
      .filter((t) => t.type === "expense" && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPendentes = transactions
      .filter((t) => t.payment_status === "pending" && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalAcumulado = totalLucros + totalGastos;

    return {
      totalDinheiro,
      totalPix,
      totalFaturado,
      totalLucros,
      totalGastos,
      totalPendentes,
      totalAcumulado,
    };
  }, [transactions]);

  return { transactions, isLoading, totals };
};
