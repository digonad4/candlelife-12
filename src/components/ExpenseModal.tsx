
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

type Client = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  user_id: string;
};

type PaymentMethod = 'pix' | 'cash' | 'invoice';

export function ExpenseModal({
  open,
  onOpenChange,
  onTransactionAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionAdded?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: clients } = useQuery({
    queryKey: ["clients", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("clients")
        .select()
        .eq("user_id", user.id)
        .order("name");
      
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    // Validar se tem cliente selecionado quando o método é faturado
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
      const { error } = await supabase.from("transactions").insert({
        description,
        amount: type === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
        payment_method: paymentMethod,
        client_id: clientId,
        type,
        user_id: user.id,
        date: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso",
      });

      onTransactionAdded?.();
      onOpenChange(false);
      setAmount("");
      setDescription("");
      setPaymentMethod("pix");
      setClientId(null);
      setType("expense");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
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
      </DialogContent>
    </Dialog>
  );
}
