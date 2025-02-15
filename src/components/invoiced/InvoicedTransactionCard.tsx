
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpIcon, ArrowDownIcon, Calendar, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  payment_method: string;
  payment_status: "pending" | "confirmed";
  client_id?: string;
  client?: {
    name: string;
  };
};

interface InvoicedTransactionCardProps {
  transaction: Transaction;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
}

export function InvoicedTransactionCard({ transaction, isSelected, onToggleSelection }: InvoicedTransactionCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors">
      <Checkbox
        id={`transaction-${transaction.id}`}
        checked={isSelected}
        onCheckedChange={() => onToggleSelection(transaction.id)}
        disabled={transaction.payment_status === "confirmed"}
      />
      <div className="flex-1 flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              transaction.type === "income" 
                ? "bg-green-500/20 text-green-500" 
                : "bg-red-500/20 text-red-500"
            }`}>
              {transaction.type === "income" ? (
                <ArrowUpIcon className="w-4 h-4" />
              ) : (
                <ArrowDownIcon className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="font-medium text-card-foreground">{transaction.description}</p>
              <p className={`text-lg font-semibold ${
                transaction.type === "income" 
                  ? "text-green-500" 
                  : "text-red-500"
              }`}>
                R$ {Math.abs(transaction.amount).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              <span>{transaction.payment_method}</span>
            </div>
            <div className="flex items-center gap-1">
              {transaction.payment_status === "confirmed" ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-500" />
              )}
              <span className={transaction.payment_status === "confirmed" ? "text-green-500" : "text-yellow-500"}>
                {transaction.payment_status === "confirmed" ? "Confirmado" : "Pendente"}
              </span>
            </div>
            {transaction.client?.name && (
              <div className="flex items-center gap-1">
                <span>Cliente: {transaction.client.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
