
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AmountInputProps {
  amount: string;
  type: "expense" | "income";
  onAmountChange: (value: string) => void;
}

export function AmountInput({ amount, type, onAmountChange }: AmountInputProps) {
  return (
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
          onChange={(e) => onAmountChange(e.target.value)}
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
  );
}
