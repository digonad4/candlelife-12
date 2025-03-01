
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { ConfirmPaymentsDialog } from "@/components/invoiced/ConfirmPaymentsDialog";

const ClientTransactions = () => {
  const { clientId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchClientData();
    fetchTransactions();
  }, [clientId, user, navigate]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente.",
        variant: "destructive"
      });
      navigate('/clients');
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .eq('payment_status', 'pending')
        .order('date', { ascending: false });

      if (error) throw error;
      
      if (data) setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSelection = (transactionId) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t.id));
    }
  };

  const handleConfirmPayments = async (paymentMethod) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          payment_status: 'paid',
          payment_method: paymentMethod 
        })
        .in('id', selectedTransactions);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `${selectedTransactions.length} pagamento(s) confirmado(s)!`,
      });
      
      // Refresh transactions
      fetchTransactions();
      setSelectedTransactions([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error confirming payments:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar os pagamentos.",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen w-full flex bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-[2000px] mx-auto space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/clients')}
                className="mb-2"
              >
                Voltar para clientes
              </Button>
              <h1 className="text-2xl md:text-4xl font-bold">
                {client?.name || 'Carregando...'}
              </h1>
              {client && (
                <p className="text-muted-foreground">
                  {client.document && `Documento: ${client.document}`}
                  {client.document && client.phone && ' | '}
                  {client.phone && `Telefone: ${client.phone}`}
                </p>
              )}
            </div>
            {selectedTransactions.length > 0 && (
              <Button onClick={() => setIsConfirmDialogOpen(true)}>
                Confirmar {selectedTransactions.length} Pagamento(s)
              </Button>
            )}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transações Pendentes</CardTitle>
              {transactions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all" 
                    checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Selecionar Todos
                  </label>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Carregando transações...</p>
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="overflow-hidden">
                      <div className="p-4 flex items-center gap-4">
                        <Checkbox 
                          checked={selectedTransactions.includes(transaction.id)}
                          onCheckedChange={() => handleTransactionSelection(transaction.id)}
                        />
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div>
                              <h3 className="font-medium">{transaction.description}</h3>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(transaction.date), "PPP", { locale: ptBR })}
                              </p>
                            </div>
                            <div className={`font-semibold ${transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                              {transaction.type === 'expense' ? '- ' : '+ '}
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-semibold">Total selecionado:</span>
                    <span className="font-bold">
                      {formatCurrency(
                        transactions
                          .filter(t => selectedTransactions.includes(t.id))
                          .reduce((sum, t) => {
                            const amount = Number(t.amount);
                            return t.type === 'expense' 
                              ? sum - amount 
                              : sum + amount;
                          }, 0)
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <p>Nenhuma transação pendente para este cliente.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <ConfirmPaymentsDialog 
          open={isConfirmDialogOpen} 
          onOpenChange={setIsConfirmDialogOpen}
          onConfirm={handleConfirmPayments}
          count={selectedTransactions.length}
          total={
            transactions
              .filter(t => selectedTransactions.includes(t.id))
              .reduce((sum, t) => {
                const amount = Number(t.amount);
                return t.type === 'expense' 
                  ? sum - amount 
                  : sum + amount;
              }, 0)
          }
        />
      </main>
    </div>
  );
};

export default ClientTransactions;
