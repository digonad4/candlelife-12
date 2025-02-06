
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TopCategories() {
  const topCategories = [
    { name: "Food", amount: 450, percentage: 45 },
    { name: "Transportation", amount: 300, percentage: 30 },
    { name: "Entertainment", amount: 250, percentage: 25 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topCategories.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{category.name}</span>
                <span className="text-gray-500">
                  ${category.amount.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
