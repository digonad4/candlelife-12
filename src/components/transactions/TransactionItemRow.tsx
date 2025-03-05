
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpIcon, ArrowDownIcon, CheckCircle2, Calendar, CreditCard, Clock, Edit2, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/transaction";

interface TransactionItemRowProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onConfirmPayment: (transaction: Transaction) => void;
}

export function TransactionItemRow({
  transaction,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onConfirmPayment,
}: TransactionItemRowProps) {
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(transaction.id)}
          className="border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
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
      <div className="flex items-center gap-4">
        {transaction.payment_status === "pending" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onConfirmPayment(transaction)}
            className="text-yellow-500 hover:text-yellow-600"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onDelete(transaction.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
