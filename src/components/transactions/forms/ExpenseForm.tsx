
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Client } from "@/types/client";

type PaymentMethod = 'pix' | 'cash' | 'invoice';

export interface ExpenseFormProps {
  amount: string;
  setAmount: (amount: string) => void;
  description: string;
  setDescription: (description: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  type: "expense" | "income";
  setType: (type: "expense" | "income") => void;
  clientId: string | null;
  setClientId: (id: string | null) => void;
  isLoading: boolean;
  clients?: Client[];
  onSubmit: (e: React.FormEvent) => void;
}

export function ExpenseForm({
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
  clients,
  onSubmit
}: ExpenseFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label className="text-lg">Tipo</Label>
        <RadioGroup
          value={type}
          onValueChange={(value) => setType(value as "expense" | "income")}
          className="grid grid-cols-2 gap-4"
        >
          <Card className={`relative flex items-center space-x-2 p-4 cursor-pointer ${
            type === "expense" ? "border-red-500" : "border-input"
          }`}>
            <RadioGroupItem value="expense" id="expense" />
            <Label htmlFor="expense" className="flex items-center gap-2 cursor-pointer">
              <ArrowDownIcon className="w-4 h-4 text-red-500" />
              <span className="text-red-500">Despesa</span>
            </Label>
          </Card>
          <Card className={`relative flex items-center space-x-2 p-4 cursor-pointer ${
            type === "income" ? "border-green-500" : "border-input"
          }`}>
            <RadioGroupItem value="income" id="income" />
            <Label htmlFor="income" className="flex items-center gap-2 cursor-pointer">
              <ArrowUpIcon className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Receita</span>
            </Label>
          </Card>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            R$
          </span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            required
            className={`pl-8 ${
              type === "expense" 
                ? "border-red-200 focus:border-red-500" 
                : "border-green-200 focus:border-green-500"
            }`}
          />
        </div>
      </div>
      
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

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
        <Select value={paymentMethod} onValueChange={(value) => {
          setPaymentMethod(value as PaymentMethod);
          if (value !== 'invoice') {
            setClientId(null);
          }
        }}>
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

      {paymentMethod === 'invoice' && (
        <div className="space-y-2">
          <Label htmlFor="client">Cliente</Label>
          <Select value={clientId || ''} onValueChange={setClientId} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
  );
}
