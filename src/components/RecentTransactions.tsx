
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions?.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="space-y-1">
                <p className="font-medium">{transaction.description}</p>
                <p className="text-sm text-gray-500">{transaction.category}</p>
                <p className="text-xs text-gray-400">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`font-mono font-medium ${
                  transaction.type === "income"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                R$ {Math.abs(transaction.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
