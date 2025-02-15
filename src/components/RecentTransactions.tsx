
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type GroupedTransactions = {
  [key: string]: {
    amount: number;
    client_id: string | null;
    created_at: string;
    date: string;
    description: string;
    id: string;
    type: string;
    payment_method: string;
    payment_status: string;
    user_id: string;
    client?: {
      name: string;
    };
  }[];
};

export function RecentTransactions() {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["recent-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          client:clients(name)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
            <div className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
            <div className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar transações por data
  const groupedTransactions = transactions?.reduce((groups: GroupedTransactions, transaction) => {
    const date = format(new Date(transaction.date), 'dd/MM/yyyy');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {groupedTransactions && Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-900 py-2">
                {format(new Date(dayTransactions[0].date), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              <div className="space-y-2">
                {dayTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex gap-3">
                      <div className={`rounded-full p-2 ${
                        transaction.type === "income" 
                          ? "bg-green-100 dark:bg-green-900/20" 
                          : "bg-red-100 dark:bg-red-900/20"
                      }`}>
                        {transaction.type === "income" ? (
                          <ArrowUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.payment_method}
                          {transaction.client?.name && ` - ${transaction.client.name}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(transaction.date), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-mono font-medium ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!transactions || transactions.length === 0) && (
            <div className="text-center py-4 text-gray-500">
              Nenhuma transação encontrada
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
