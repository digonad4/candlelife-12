
import { useState } from "react";
import { Transaction } from "@/types/transaction";

export function useTransactionSelection(days: [string, Transaction[]][]) {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(
      days
        .flatMap(([, transactions]) => transactions)
        .filter((t) => t.payment_method !== "invoice" || t.payment_status === "confirmed")
        .map((t) => t.id)
    );
    setSelectedTransactions(allIds);
  };

  const deselectAll = () => {
    setSelectedTransactions(new Set());
  };

  return {
    selectedTransactions,
    setSelectedTransactions,
    toggleSelection,
    selectAll,
    deselectAll
  };
}
