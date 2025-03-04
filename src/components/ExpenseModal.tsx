
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransactionForm } from "./transaction/useTransactionForm";
import { TransactionTypeSelector } from "./transaction/TransactionTypeSelector";
import { AmountInput } from "./transaction/AmountInput";
import { PaymentMethodSelector } from "./transaction/PaymentMethodSelector";
import { ClientSelector } from "./transaction/ClientSelector";

export function ExpenseModal({
  open,
  onOpenChange,
  onTransactionAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionAdded?: () => void;
}) {
  const {
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
    handleSubmit
  } = useTransactionForm({
    onSuccess: onTransactionAdded,
    onClose: () => onOpenChange(false)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <TransactionTypeSelector 
            type={type} 
            onTypeChange={setType} 
          />

          <AmountInput 
            amount={amount} 
            type={type} 
            onAmountChange={setAmount} 
          />
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Corrida, Manutenção..."
              required
              className="focus:border-primary"
            />
          </div>

          <PaymentMethodSelector 
            paymentMethod={paymentMethod} 
            onPaymentMethodChange={setPaymentMethod}
            onClientReset={() => setClientId(null)} 
          />

          {paymentMethod === 'invoice' && (
            <ClientSelector 
              clientId={clientId} 
              onClientChange={setClientId} 
              required={true}
            />
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            variant={type === "expense" ? "destructive" : "default"}
          >
            {isLoading ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
