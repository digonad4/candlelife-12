
import { Transaction } from "@/types/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormEvent, useState } from "react";

interface EditTransactionFormProps {
  transaction: Transaction;
  onSubmit: (formData: EditFormData) => void;
}

export interface EditFormData {
  description: string;
  amount: string;
  type: "expense" | "income";
  payment_method: string;
  payment_status: "pending" | "confirmed";
}

export function EditTransactionForm({ transaction, onSubmit }: EditTransactionFormProps) {
  const [formData, setFormData] = useState<EditFormData>({
    description: transaction.description,
    amount: Math.abs(transaction.amount).toString(),
    type: transaction.type,
    payment_method: transaction.payment_method,
    payment_status: transaction.payment_status
  });

  const handleChange = (key: keyof EditFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input 
          id="description"
          value={formData.description} 
          onChange={(e) => handleChange("description", e.target.value)} 
          className="bg-background"
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor</Label>
        <Input 
          id="amount"
          type="number" 
          value={formData.amount} 
          onChange={(e) => handleChange("amount", e.target.value)} 
          className="bg-background"
          required 
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(value) => handleChange("type", value as "income" | "expense")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="income" id="income" />
            <Label htmlFor="income">Receita</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="expense" id="expense" />
            <Label htmlFor="expense">Despesa</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method">Método de Pagamento</Label>
        <Select
          value={formData.payment_method}
          onValueChange={(value) => handleChange("payment_method", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o método de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="cash">Dinheiro</SelectItem>
            <SelectItem value="invoice">Faturado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_status">Status do Pagamento</Label>
        <Select
          value={formData.payment_status}
          onValueChange={(value) => handleChange("payment_status", value as "pending" | "confirmed")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">Salvar</Button>
    </form>
  );
}
