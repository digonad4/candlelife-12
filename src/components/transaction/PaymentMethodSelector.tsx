
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PaymentMethod = 'pix' | 'cash' | 'invoice';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onClientReset?: () => void; // Optional callback for when payment method changes from invoice
}

export function PaymentMethodSelector({ 
  paymentMethod, 
  onPaymentMethodChange,
  onClientReset
}: PaymentMethodSelectorProps) {
  const handleChange = (value: string) => {
    const method = value as PaymentMethod;
    onPaymentMethodChange(method);
    
    // If changing from invoice to another method, reset the client
    if (paymentMethod === 'invoice' && method !== 'invoice' && onClientReset) {
      onClientReset();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
      <Select value={paymentMethod} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a forma de pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pix">PIX</SelectItem>
          <SelectItem value="cash">Dinheiro</SelectItem>
          <SelectItem value="invoice">Faturado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
