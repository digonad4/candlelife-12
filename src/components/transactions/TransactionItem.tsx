
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpIcon, ArrowDownIcon, CheckCircle2, Calendar, CreditCard } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/transaction";

interface TransactionItemProps {
  transaction: Transaction;
  selectedTransactions: string[];
  onSelectTransaction: (id: string, isPending: boolean) => void;
  onOpenConfirmDialog: (ids: string[]) => void;
}

export function TransactionItem({
  transaction,
  selectedTransactions,
  onSelectTransaction,
  onOpenConfirmDialog,
}: TransactionItemProps) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent/20 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
    >
      <div className="flex gap-2 items-center">
        {transaction.payment_status === "pending" && (
          <Checkbox
            checked={selectedTransactions.includes(transaction.id)}
            onCheckedChange={() =>
              onSelectTransaction(transaction.id, transaction.payment_status === "pending")
            }
          />
        )}
        <div
          className={`p-1 rounded-full ${
            transaction.type === "income"
              ? "bg-green-500/20 text-green-500 dark:bg-green-500/30 dark:text-green-400"
              : "bg-red-500/20 text-red-500 dark:bg-red-500/30 dark:text-red-400"
          }`}
        >
          {transaction.type === "income" ? (
            <ArrowUpIcon className="w-4 h-4" />
          ) : (
            <ArrowDownIcon className="w-4 h-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-card-foreground dark:text-gray-200">{transaction.description}</p>
          <p className="text-xs text-muted-foreground dark:text-gray-400">
            <Calendar className="inline w-3 h-3 mr-1" />
            {format(parseISO(transaction.date), "dd/MM/yyyy HH:mm", { locale: ptBR })} -{" "}
            {transaction.payment_status === "pending" ? "Pendente" : "Confirmada"} -{" "}
            <CreditCard className="inline w-3 h-3 mr-1" />
            {transaction.payment_method === "cash"
              ? "Dinheiro"
              : transaction.payment_method === "pix"
              ? "Pix"
              : "Faturado"}
          </p>
          {transaction.client?.name && (
            <p className="text-xs text-muted-foreground dark:text-gray-400">Cliente: {transaction.client.name}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p
          className={`text-sm font-medium ${
            transaction.amount >= 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          R$ {transaction.amount.toFixed(2)}
        </p>
        {transaction.payment_status === "pending" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenConfirmDialog([transaction.id])}
            className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 w-6 h-6"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
