
import { EditTransactionDialog } from "@/components/transactions/EditTransactionDialog";
import { DeleteTransactionDialog } from "@/components/transactions/DeleteTransactionDialog";
import { ConfirmPaymentDialog } from "@/components/transactions/ConfirmPaymentDialog";
import { Transaction } from "@/types/transaction";

interface TransactionDialogsProps {
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  selectedTransaction: Transaction | null;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  transactionToDelete: string | null;
  isConfirmPaymentDialogOpen: boolean;
  setIsConfirmPaymentDialogOpen: (open: boolean) => void;
  transactionToConfirm: Transaction | null;
  userId?: string;
  selectedTransactions: Set<string>;
}

export function TransactionDialogs({
  isEditModalOpen,
  setIsEditModalOpen,
  selectedTransaction,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  transactionToDelete,
  isConfirmPaymentDialogOpen,
  setIsConfirmPaymentDialogOpen,
  transactionToConfirm,
  userId,
  selectedTransactions
}: TransactionDialogsProps) {
  return (
    <>
      <EditTransactionDialog
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        transaction={selectedTransaction}
        userId={userId}
      />

      <DeleteTransactionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        transactionId={transactionToDelete}
        userId={userId}
        selectedTransactions={selectedTransactions}
        isBulkDelete={!transactionToDelete}
      />

      <ConfirmPaymentDialog
        open={isConfirmPaymentDialogOpen}
        onOpenChange={setIsConfirmPaymentDialogOpen}
        transaction={transactionToConfirm}
        userId={userId}
        selectedTransactions={selectedTransactions}
        isBulkConfirm={!transactionToConfirm}
      />
    </>
  );
}
