
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";

const Categories = () => {
  const categories = [
    { name: "Alimentação", color: "bg-blue-500", percentage: 35 },
    { name: "Transporte", color: "bg-green-500", percentage: 25 },
    { name: "Lazer", color: "bg-purple-500", percentage: 20 },
    { name: "Saúde", color: "bg-yellow-500", percentage: 15 },
    { name: "Outros", color: "bg-gray-500", percentage: 5 },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold">Categorias</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <Card key={category.name} className="rounded-xl hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Percentual de gastos</span>
                      <span>{category.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${category.color} rounded-full`}
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Categories;
