import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/transaction";
interface TransactionActionBarProps {
  selectedTransactions: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onConfirmSelected: () => void;
  onDeleteSelected: () => void;
}
export function TransactionActionBar({
  selectedTransactions,
  onSelectAll,
  onDeselectAll,
  onConfirmSelected,
  onDeleteSelected
}: TransactionActionBarProps) {
  return;
}