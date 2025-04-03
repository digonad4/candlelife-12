
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditTransactionForm, EditFormData } from "@/components/transactions/EditTransactionForm";
import { Transaction } from "@/types/transaction";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  userId: string | undefined;
}

export function EditTransactionDialog({
  isOpen,
  onOpenChange,
  transaction,
  userId,
}: EditTransactionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (formData: EditFormData) => {
    if (!userId || !transaction) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          description: formData.description,
          amount: formData.type === "expense" ? -Math.abs(Number(formData.amount)) : Math.abs(Number(formData.amount)),
          type: formData.type,
          payment_method: formData.payment_method,
          payment_status: formData.payment_status,
          client_id: formData.client_id || null,
        })
        .eq("id", transaction.id)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso",
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar a transação",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Editar Transação</DialogTitle>
        </DialogHeader>
        {transaction && (
          <EditTransactionForm transaction={transaction} onSubmit={handleSubmit} />
        )}
      </DialogContent>
    </Dialog>
  );
}
