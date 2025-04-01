import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

interface ClientSummary {
  client_id: string;
  client_name: string;
  total_amount: number;
  transactions_count: number;
}

export const InvoicedSummary = () => {
  const { user } = useAuth();
  const [clientSummaries, setClientSummaries] = useState<ClientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalInvoiced, setTotalInvoiced] = useState(0);

  useEffect(() => {
    if (user) {
      loadInvoicedSummary();
    }
  }, [user]);

  const loadInvoicedSummary = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // First get all invoiced transactions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          id, amount, client_id,
          client:clients(id, name)
        `)
        .eq('user_id', user.id)
        .eq('payment_method', 'invoice')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Process transactions to get totals by client
      const clientTotalsMap = new Map<string, ClientSummary>();
      let overallTotal = 0;
      
      transactions?.forEach((transaction: any) => {
        const clientId = transaction.client_id;
        const clientName = transaction.client?.name || 'Cliente não especificado';
        const amount = Number(transaction.amount);
        
        overallTotal += amount;
        
        if (clientId) {
          if (clientTotalsMap.has(clientId)) {
            const existing = clientTotalsMap.get(clientId)!;
            existing.total_amount += amount;
            existing.transactions_count += 1;
            clientTotalsMap.set(clientId, existing);
          } else {
            clientTotalsMap.set(clientId, {
              client_id: clientId,
              client_name: clientName,
              total_amount: amount,
              transactions_count: 1
            });
          }
        }
      });
      
      // Convert map to array and sort by amount
      const summaries = Array.from(clientTotalsMap.values())
        .sort((a, b) => b.total_amount - a.total_amount);
      
      setClientSummaries(summaries);
      setTotalInvoiced(overallTotal);
    } catch (error) {
      console.error('Error loading invoiced summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resumo Faturado por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Resumo Faturado por Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-lg font-bold">Total Geral Faturado: <span className="text-green-600">R$ {totalInvoiced.toFixed(2)}</span></p>
        </div>
        
        {clientSummaries.length > 0 ? (
          <div className="space-y-4">
            {clientSummaries.map((summary) => (
              <div key={summary.client_id} className="border-b pb-3 last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium">{summary.client_name}</h3>
                  <span className="text-green-600 font-bold">R$ {summary.total_amount.toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {summary.transactions_count} {summary.transactions_count === 1 ? 'transação' : 'transações'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma transação faturada encontrada
          </p>
        )}
      </CardContent>
    </Card>
  );
};
