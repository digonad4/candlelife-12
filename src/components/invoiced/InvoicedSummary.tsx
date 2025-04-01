import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface InvoicedSummaryProps {
  startDate?: Date;
  endDate?: Date;
}

const InvoicedSummary = ({ startDate, endDate }: InvoicedSummaryProps) => {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["invoiced-summary", user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return null;

      const userId = user.id;

      let query = supabase
        .from("transactions")
        .select("count")
        .eq("user_id", userId)
        .eq("payment_method", "invoice");

      if (startDate) {
        query = query.gte("date", format(startDate, "yyyy-MM-dd'T00:00:00.000Z'"));
      }
      if (endDate) {
        query = query.lte("date", format(endDate, "yyyy-MM-dd'T23:59:59.999Z'"));
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar o resumo de faturas:", error);
        throw error;
      }

      const totalInvoices = data ? data[0]?.count || 0 : 0;

      query = supabase
        .from("transactions")
        .select("count")
        .eq("user_id", userId)
        .eq("payment_method", "invoice")
        .eq("payment_status", "pending");

      if (startDate) {
        query = query.gte("date", format(startDate, "yyyy-MM-dd'T00:00:00.000Z'"));
      }
      if (endDate) {
        query = query.lte("date", format(endDate, "yyyy-MM-dd'T23:59:59.999Z'"));
      }

      const { data: pendingData, error: pendingError } = await query;

      if (pendingError) {
        console.error("Erro ao buscar faturas pendentes:", pendingError);
        throw pendingError;
      }

      const pendingInvoices = pendingData ? pendingData[0]?.count || 0 : 0;

      return {
        totalInvoices,
        pendingInvoices,
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle>Resumo de Faturas</CardTitle>
      </CardHeader>
      <CardContent>
        Carregando...
      </CardContent>
    </Card>;
  }

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle>Resumo de Faturas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total de Faturas</p>
            <p className="text-2xl font-bold text-foreground">{summary?.totalInvoices || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Faturas Pendentes</p>
            <p className="text-2xl font-bold text-orange-500">{summary?.pendingInvoices || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoicedSummary;
