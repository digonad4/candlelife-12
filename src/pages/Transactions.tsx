
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";

const Transactions = () => {
  const transactions = [
    {
      id: 1,
      description: "Supermercado",
      amount: -250.00,
      category: "Alimentação",
      date: "2024-03-10",
    },
    {
      id: 2,
      description: "Uber",
      amount: -35.90,
      category: "Transporte",
      date: "2024-03-09",
    },
    {
      id: 3,
      description: "Cinema",
      amount: -60.00,
      category: "Lazer",
      date: "2024-03-08",
    },
    {
      id: 4,
      description: "Farmácia",
      amount: -120.50,
      category: "Saúde",
      date: "2024-03-07",
    },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold">Transações</h1>
          
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.category}</p>
                      <p className="text-xs text-gray-400">{transaction.date}</p>
                    </div>
                    <span
                      className={`font-mono font-medium ${
                        transaction.amount >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      R$ {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Transactions;
