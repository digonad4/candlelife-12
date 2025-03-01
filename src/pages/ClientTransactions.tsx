
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, CheckCircle, Calendar, Ban } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ClientTransactions = () => {
  const { clientId } = useParams();
  const [client, setClient] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClientData();
    fetchTransactions();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) {
        throw error;
      }

      setClient(data);
    } catch (error: any) {
      console.error("Error fetching client:", error.message);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive",
      });
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("client_id", clientId)
        .eq("type", "receita")
        .eq("payment_status", "pending")
        .order("date", { ascending: false });

      if (error) {
        throw error;
      }

      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error.message);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP", { locale: ptBR });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map((t) => t.id));
    }
  };

  const handleSelectTransaction = (id: string) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter((t) => t !== id));
    } else {
      setSelectedTransactions([...selectedTransactions, id]);
    }
  };

  const openConfirmDialog = () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: "Selecione transações",
        description: "Você precisa selecionar pelo menos uma transação para confirmar o pagamento.",
        variant: "destructive",
      });
      return;
    }
    setIsConfirmDialogOpen(true);
  };

  const confirmPayments = async () => {
    try {
      const updates = selectedTransactions.map((id) => ({
        id,
        payment_status: "paid",
        payment_method: paymentMethod,
      }));

      const { error } = await supabase.from("transactions").upsert(updates);

      if (error) {
        throw error;
      }

      toast({
        title: "Pagamentos confirmados",
        description: `${selectedTransactions.length} transações foram confirmadas como pagas.`,
      });

      setSelectedTransactions([]);
      setIsConfirmDialogOpen(false);
      fetchTransactions();
    } catch (error: any) {
      console.error("Error confirming payments:", error.message);
      toast({
        title: "Error",
        description: "Failed to confirm payments",
        variant: "destructive",
      });
    }
  };

  const totalSelected = transactions
    .filter((t) => selectedTransactions.includes(t.id))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col space-y-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Transações de {client?.name || "Cliente"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {client?.email && `${client.email} · `}
                {client?.phone && `${client.phone}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/clients")}>
                Voltar para Clientes
              </Button>
              <Button 
                onClick={openConfirmDialog} 
                disabled={selectedTransactions.length === 0}
              >
                Confirmar Pagamentos
              </Button>
            </div>
          </div>

          {transactions.length === 0 && !isLoading ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sem transações pendentes</AlertTitle>
              <AlertDescription>
                Este cliente não tem transações pendentes no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Transações Pendentes</CardTitle>
                  {transactions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="selectAll"
                        checked={
                          selectedTransactions.length > 0 &&
                          selectedTransactions.length === transactions.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                      <label
                        htmlFor="selectAll"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Selecionar Todas
                      </label>
                    </div>
                  )}
                </div>
                <CardDescription>
                  {transactions.length} transações pendentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          checked={selectedTransactions.includes(transaction.id)}
                          onCheckedChange={() =>
                            handleSelectTransaction(transaction.id)
                          }
                        />
                        <div>
                          <h3 className="font-medium">{transaction.description}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {formatDate(transaction.date)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(parseFloat(transaction.amount))}
                        </div>
                        <Badge
                          variant={
                            transaction.payment_status === "paid"
                              ? "success"
                              : transaction.payment_status === "pending"
                              ? "outline"
                              : "destructive"
                          }
                          className="mt-1"
                        >
                          {transaction.payment_status === "paid"
                            ? "Pago"
                            : transaction.payment_status === "pending"
                            ? "Pendente"
                            : "Cancelado"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              {selectedTransactions.length > 0 && (
                <CardFooter className="flex justify-between border-t p-4">
                  <div>
                    <span className="text-sm">
                      {selectedTransactions.length} transações selecionadas
                    </span>
                  </div>
                  <div className="font-bold">
                    Total: {formatCurrency(totalSelected)}
                  </div>
                </CardFooter>
              )}
            </Card>
          )}
        </div>

        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Pagamentos</DialogTitle>
              <DialogDescription>
                Você está confirmando o pagamento de {selectedTransactions.length} transações no
                valor total de {formatCurrency(totalSelected)}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pagamento</label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Crédito">
                      Cartão de Crédito
                    </SelectItem>
                    <SelectItem value="Cartão de Débito">
                      Cartão de Débito
                    </SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmPayments}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ClientTransactions;
