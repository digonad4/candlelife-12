
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecentTransactions() {
  const transactions = [
    { id: 1, description: "Groceries", amount: -50, category: "Food" },
    { id: 2, description: "Bus Ticket", amount: -2.5, category: "Transportation" },
    { id: 3, description: "Movie", amount: -15, category: "Entertainment" },
    { id: 4, description: "Salary", amount: 2000, category: "Income" },
    { id: 5, description: "Dinner", amount: -30, category: "Food" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div>
                <p className="font-medium">{transaction.description}</p>
                <p className="text-sm text-gray-500">{transaction.category}</p>
              </div>
              <span
                className={`font-mono font-medium ${
                  transaction.amount >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {transaction.amount >= 0 ? "+" : ""}
                {transaction.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
