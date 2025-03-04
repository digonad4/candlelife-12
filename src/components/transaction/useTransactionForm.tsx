
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

type PaymentMethod = 'pix' | 'cash' | 'invoice';

interface UseTransactionFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function useTransactionForm({ onSuccess, onClose }: UseTransactionFormProps = {}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    // Validate client selection when invoice is selected
    if (paymentMethod === 'invoice' && !clientId) {
      toast({
        title: "Erro",
        description: "Selecione um cliente para transações faturadas",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("transactions")
        .insert({
          description,
          amount: type === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
          client_id: clientId,
          type,
          user_id: user.id,
          payment_method: paymentMethod,
          payment_status: 'pending',
          date: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso",
      });

      onSuccess?.();
      onClose?.();
      resetForm();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar transação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setPaymentMethod("pix");
    setClientId(null);
    setType("expense");
  };

  return {
    amount,
    setAmount,
    description,
    setDescription,
    paymentMethod,
    setPaymentMethod,
    type,
    setType,
    clientId,
    setClientId,
    isLoading,
    handleSubmit,
    resetForm
  };
}
