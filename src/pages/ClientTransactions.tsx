
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Check, DollarSign, CreditCard, Wallet } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  payment_status: string;
  payment_method: string;
  type: string;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
}

const ClientTransactions = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("Dinheiro");

  useEffect(() => {
    if (user && clientId) {
      fetchClientData();
      fetchTransactions();
    }
  }, [user, clientId]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error("Error fetching client:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente",
        variant: "destructive",
      });
      navigate("/clients");
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("client_id", clientId)
        .eq("user_id", user?.id)
        .order("date", { ascending: false });

      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.filter(t => t.payment_status === "pending").length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(
        transactions
          .filter(t => t.payment_status === "pending")
          .map(t => t.id)
      );
    }
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    confirmPayments();
  };

  const confirmPayments = async () => {
    if (selectedTransactions.length === 0) return;
    
    try {
      setConfirmingPayment(true);
      
      // Update each transaction individually
      for (const transactionId of selectedTransactions) {
        const { error } = await supabase
          .from("transactions")
          .update({
            payment_status: "paid",
            payment_method: paymentMethod
          })
          .eq("id", transactionId)
          .eq("user_id", user?.id);
          
        if (error) throw error;
      }
      
      toast({
        title: "Pagamentos confirmados",
        description: `${selectedTransactions.length} transações foram marcadas como pagas`,
      });
      
      setSelectedTransactions([]);
      setIsConfirmDialogOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error("Error confirming payments:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar os pagamentos",
        variant: "destructive",
      });
    } finally {
      setConfirmingPayment(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="secondary" className="bg-green-500">Pago</Badge>;
      case "pending":
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTotalSelected = () => {
    return transactions
      .filter(t => selectedTransactions.includes(t.id))
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate("/clients")}
                className="mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Clientes
              </Button>
              
              <h1 className="text-3xl font-bold">
                Transações de {client?.name || "..."}
              </h1>
              
              {client && (
                <div className="text-sm text-muted-foreground mt-1">
                  {client.email && <span className="mr-4">Email: {client.email}</span>}
                  {client.phone && <span className="mr-4">Telefone: {client.phone}</span>}
                  {client.document && <span>Documento: {client.document}</span>}
                </div>
              )}
            </div>
            
            {selectedTransactions.length > 0 && (
              <Button
                onClick={() => setIsConfirmDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Confirmar Pagamento ({selectedTransactions.length})
              </Button>
            )}
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Histórico de Transações</CardTitle>
              
              {transactions.filter(t => t.payment_status === "pending").length > 0 && (
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedTransactions.length === transactions.filter(t => t.payment_status === "pending").length
                    ? "Desmarcar Todos"
                    : "Selecionar Todos Pendentes"}
                </Button>
              )}
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Carregando transações...</div>
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex items-start gap-3 w-full sm:w-auto">
                        {transaction.payment_status === "pending" && (
                          <Checkbox
                            checked={selectedTransactions.includes(transaction.id)}
                            onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                            className="mt-1"
                          />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <h3 className="font-semibold">{transaction.description}</h3>
                            {getStatusBadge(transaction.payment_status)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <p>Data: {format(new Date(transaction.date), 'dd/MM/yyyy')}</p>
                            {transaction.payment_status === "paid" && (
                              <p>Método: {transaction.payment_method}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-lg font-semibold self-end sm:self-center">
                        {formatCurrency(Number(transaction.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  Nenhuma transação encontrada para este cliente.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Payment confirmation dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">
              Confirmar pagamento de {selectedTransactions.length} transações no valor total de{" "}
              <strong>{formatCurrency(getTotalSelected())}</strong>?
            </p>
            
            <p className="font-semibold mb-2">Selecione a forma de pagamento:</p>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => handlePaymentMethodSelect("Dinheiro")}
                className="flex justify-center items-center"
                disabled={confirmingPayment}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Dinheiro
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handlePaymentMethodSelect("Cartão")}
                className="flex justify-center items-center"
                disabled={confirmingPayment}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Cartão
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handlePaymentMethodSelect("Pix")}
                className="flex justify-center items-center"
                disabled={confirmingPayment}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Pix
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handlePaymentMethodSelect("Transferência")}
                className="flex justify-center items-center"
                disabled={confirmingPayment}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Transferência
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={confirmingPayment}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientTransactions;
