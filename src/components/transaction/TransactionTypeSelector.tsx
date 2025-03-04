
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface TransactionTypeSelectorProps {
  type: "expense" | "income";
  onTypeChange: (value: "expense" | "income") => void;
}

export function TransactionTypeSelector({ type, onTypeChange }: TransactionTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-lg">Tipo</Label>
      <RadioGroup
        value={type}
        onValueChange={(value) => onTypeChange(value as "expense" | "income")}
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
  );
}
