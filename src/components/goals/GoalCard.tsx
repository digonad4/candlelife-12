
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoalProgress } from "@/hooks/useGoalProgress";
import { Pencil, Trash2, Target, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface GoalCardProps {
  progress: GoalProgress;
  onEdit: () => void;
  onDelete: () => void;
}

const goalTypeLabels = {
  expense_limit: "Limite de Gastos",
  total_expense_limit: "Limite Total",
  income_target: "Meta de Receita", 
  savings_target: "Meta de Poupança"
};

const goalTypeIcons = {
  expense_limit: TrendingDown,
  total_expense_limit: TrendingDown,
  income_target: TrendingUp,
  savings_target: DollarSign
};

export function GoalCard({ progress, onEdit, onDelete }: GoalCardProps) {
  const { goal, current, target, percentage, status, projectedFinal } = progress;
  
  const Icon = goalTypeIcons[goal.goal_type];
  
  const getStatusColor = () => {
    switch (status) {
      case "achieved": return "bg-green-500";
      case "on_track": return "bg-blue-500";
      case "warning": return "bg-yellow-500";
      case "exceeded": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "achieved": return "Atingida";
      case "on_track": return "No caminho";
      case "warning": return "Atenção";
      case "exceeded": return "Excedida";
      default: return "Status";
    }
  };

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {goalTypeLabels[goal.goal_type]}
              {goal.category && ` - ${goal.category}`}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor() + " text-white"}>
              {getStatusLabel()}
            </Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span className="font-medium">{Math.round(percentage)}%</span>
          </div>
          <Progress value={Math.min(percentage, 100)} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Atual</p>
            <p className="font-semibold text-lg">{formatCurrency(current)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Meta</p>
            <p className="font-semibold text-lg">{formatCurrency(target)}</p>
          </div>
        </div>
        
        {Math.abs(projectedFinal - current) > 50 && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Projeção do Mês</span>
            </div>
            <p className="text-sm text-muted-foreground">
              No ritmo atual: {formatCurrency(projectedFinal)}
              {goal.goal_type.includes("expense") && projectedFinal > target && (
                <span className="text-red-600 ml-2">
                  ({formatCurrency(projectedFinal - target)} acima da meta)
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
