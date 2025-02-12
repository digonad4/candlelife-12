
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function TopCategories() {
  const { user } = useAuth();

  const { data: topCategories, isLoading } = useQuery({
    queryKey: ["top-categories", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "expense");

      if (transactionsError) throw transactionsError;

      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id);

      if (categoriesError) throw categoriesError;

      const categoryTotals = transactions.reduce((acc: Record<string, number>, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + Math.abs(transaction.amount);
        return acc;
      }, {});

      const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

      return categories
        .map(category => ({
          name: category.name,
          amount: categoryTotals[category.name] || 0,
          percentage: total ? Math.round((categoryTotals[category.name] || 0) * 100 / total) : 0,
          color: category.color
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-2 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topCategories?.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{category.name}</span>
                <span className="text-gray-500">
                  R$ {category.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-in-out"
                  style={{ 
                    width: `${category.percentage}%`,
                    backgroundColor: category.color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
