
import { Transaction } from "@/types/transaction";
import { useMemo } from "react";

interface FinancialSummaryProps {
  transactions: Transaction[];
}

export function FinancialSummary({ transactions }: FinancialSummaryProps) {
  const totals = useMemo(() => {
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

  return (
    <div className="p-4 bg-muted rounded-lg shadow-sm dark:bg-gray-800">
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between items-center">
          <span className="text-muted-foreground dark:text-gray-400">Receitas em Dinheiro</span>
          <span className="font-medium text-green-600 dark:text-green-400">R$ {totals.totalDinheiro.toFixed(2)}</span>
        </li>
        <li className="flex justify-between items-center">
          <span className="text-muted-foreground dark:text-gray-400">Receitas em Pix</span>
          <span className="font-medium text-green-600 dark:text-green-400">R$ {totals.totalPix.toFixed(2)}</span>
        </li>
        <li className="flex justify-between items-center">
          <span className="text-muted-foreground dark:text-gray-400">Receitas Faturadas</span>
          <span className="font-medium text-green-600 dark:text-green-400">R$ {totals.totalFaturado.toFixed(2)}</span>
        </li>
        <li className="flex justify-between items-center">
          <span className="text-muted-foreground dark:text-gray-400">Receitas Pendentes</span>
          <span className="font-medium text-yellow-600 dark:text-yellow-400">R$ {totals.totalPendentes.toFixed(2)}</span>
        </li>
        <li className="flex justify-between items-center">
          <span className="text-muted-foreground dark:text-gray-400">Total de Lucros</span>
          <span className="font-medium text-green-600 dark:text-green-400">R$ {totals.totalLucros.toFixed(2)}</span>
        </li>
        <li className="flex justify-between items-center">
          <span className="text-muted-foreground dark:text-gray-400">Total de Gastos</span>
          <span className="font-medium text-red-600 dark:text-red-400">R$ {totals.totalGastos.toFixed(2)}</span>
        </li>
        <li className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
          <span className="text-muted-foreground font-semibold dark:text-gray-300">Total Acumulado</span>
          <span
            className={`text-lg font-semibold ${
              totals.totalAcumulado >= 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
            }`}
          >
            R$ {totals.totalAcumulado.toFixed(2)}
          </span>
        </li>
      </ul>
    </div>
  );
}
