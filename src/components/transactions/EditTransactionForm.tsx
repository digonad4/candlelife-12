import { Transaction } from "@/types/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EditTransactionFormProps {
  transaction: Transaction;
  onSubmit: (formData: EditFormData) => void;
}

export interface EditFormData {
  description: string;
  amount: string;
  type: "expense" | "income" | "investment";
  payment_method: string;
  payment_status: "pending" | "confirmed" | "failed";
  client_id?: string;
  goal_id?: string;
}

export function EditTransactionForm({ transaction, onSubmit }: EditTransactionFormProps) {
  const [formData, setFormData] = useState<EditFormData>({
    description: transaction.description,
    amount: Math.abs(transaction.amount).toString(),
    type: transaction.type,
    payment_method: transaction.payment_method,
    payment_status: transaction.payment_status,
    client_id: transaction.client_id || "",
    goal_id: transaction.goal_id || "none",
  });

  // Busca os clientes do Supabase
  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Busca as metas financeiras
  const { data: goals, isLoading: isGoalsLoading } = useQuery({
    queryKey: ["financial-goals-edit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("id, description")
        .eq("active", true)
        .order("description", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleChange = (key: keyof EditFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      goal_id: formData.goal_id === "none" ? "" : formData.goal_id
    };
    onSubmit(submitData);
  };

  const isInvoiceSelected = formData.payment_method === "invoice";
  const isInvestmentSelected = formData.type === "investment";

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
          onValueChange={(value) => handleChange("type", value as "income" | "expense" | "investment")}
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
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="investment" id="investment" />
            <Label htmlFor="investment">Investimento</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method">Método de Pagamento</Label>
        <Select
          value={formData.payment_method}
          onValueChange={(value) => {
            handleChange("payment_method", value);
            if (value !== "invoice") {
              handleChange("client_id", "");
            }
          }}
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

      {/* Campo de seleção de cliente, exibido apenas se "Faturado" for selecionado */}
      {isInvoiceSelected && (
        <div className="space-y-2">
          <Label htmlFor="client_id">Cliente</Label>
          <Select
            value={formData.client_id}
            onValueChange={(value) => handleChange("client_id", value)}
            disabled={isClientsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={isClientsLoading ? "Carregando clientes..." : "Selecione um cliente"} />
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

      {/* Campo de seleção de meta, exibido apenas se "Investimento" for selecionado */}
      {isInvestmentSelected && (
        <div className="space-y-2">
          <Label htmlFor="goal_id">Meta Financeira</Label>
          <Select
            value={formData.goal_id}
            onValueChange={(value) => handleChange("goal_id", value)}
            disabled={isGoalsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={isGoalsLoading ? "Carregando metas..." : "Selecione uma meta (opcional)"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma meta</SelectItem>
              {goals?.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="payment_status">Status do Pagamento</Label>
        <Select
          value={formData.payment_status}
          onValueChange={(value) => handleChange("payment_status", value as "pending" | "confirmed" | "failed")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isInvoiceSelected && !formData.client_id}>
        Salvar
      </Button>
    </form>
  );
}
