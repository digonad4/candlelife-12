
import { Card, CardContent } from "@/components/ui/card";
import { TransactionSummary } from "./types";

interface FinancialSummaryProps {
  totals: TransactionSummary;
}

export const FinancialSummary = ({ totals }: FinancialSummaryProps) => {
  return (
    <div className="mb-8">
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
    </div>
  );
};
