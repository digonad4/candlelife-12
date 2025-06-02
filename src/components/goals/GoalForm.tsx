
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateGoalData, FinancialGoal } from "@/hooks/useGoals";

interface GoalFormProps {
  goal?: FinancialGoal;
  onSubmit: (data: CreateGoalData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function GoalForm({ goal, onSubmit, onCancel, isLoading }: GoalFormProps) {
  const [formData, setFormData] = useState<CreateGoalData>({
    goal_type: goal?.goal_type || "expense_limit",
    category: goal?.category || "",
    amount: goal?.amount || 0,
    period: goal?.period || "monthly",
    start_date: goal?.start_date || new Date().toISOString().split('T')[0],
    end_date: goal?.end_date || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      end_date: formData.end_date || undefined,
      category: formData.category || undefined,
    });
  };

  const goalTypeOptions = [
    { value: "expense_limit", label: "Limite de Gastos por Categoria" },
    { value: "total_expense_limit", label: "Limite Total de Gastos" },
    { value: "income_target", label: "Meta de Receita" },
    { value: "savings_target", label: "Meta de Poupança" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal_type">Tipo de Meta</Label>
        <Select
          value={formData.goal_type}
          onValueChange={(value: any) => setFormData({ ...formData, goal_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de meta" />
          </SelectTrigger>
          <SelectContent>
            {goalTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(formData.goal_type === "expense_limit") && (
        <div className="space-y-2">
          <Label htmlFor="category">Categoria (opcional)</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Ex: Alimentação, Transporte..."
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          placeholder="0,00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="period">Período</Label>
        <Select
          value={formData.period}
          onValueChange={(value: any) => setFormData({ ...formData, period: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Data de Início</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Data de Fim (opcional)</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : goal ? "Atualizar Meta" : "Criar Meta"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
