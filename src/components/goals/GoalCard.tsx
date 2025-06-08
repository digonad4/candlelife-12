
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GoalProgress } from "@/hooks/useGoalProgress";
import { useGoals } from "@/hooks/useGoals";
import { Edit, Trash2, Plus, PiggyBank, ShoppingCart, TrendingUp, Target, Calendar, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GoalCardProps {
  progress: GoalProgress;
  onEdit: () => void;
  onDelete: () => void;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "emergency_fund": return <PiggyBank className="h-5 w-5" />;
    case "purchase_goal": return <ShoppingCart className="h-5 w-5" />;
    case "investment_goal": return <TrendingUp className="h-5 w-5" />;
    default: return <Target className="h-5 w-5" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "emergency_fund": return "Reserva de Emergência";
    case "purchase_goal": return "Meta de Compra";
    case "investment_goal": return "Meta de Investimento";
    default: return "Meta Personalizada";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "achieved": return "bg-green-500";
    case "on_track": return "bg-blue-500";
    case "warning": return "bg-yellow-500";
    case "behind": return "bg-red-500";
    default: return "bg-gray-500";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "achieved": return "✅ Conquistado";
    case "on_track": return "📈 No Caminho";
    case "warning": return "⚠️ Atenção";
    case "behind": return "🔴 Atrasado";
    default: return "📊 Em Progresso";
  }
};

export function GoalCard({ progress, onEdit, onDelete }: GoalCardProps) {
  const [contributionAmount, setContributionAmount] = useState("");
  const [isAddingContribution, setIsAddingContribution] = useState(false);
  const { addContribution, isAddingContribution: isLoading } = useGoals();
  
  const { goal, current, target, percentage, status, daysRemaining, monthlyTarget } = progress;
  
  const handleAddContribution = () => {
    const amount = parseFloat(contributionAmount);
    if (amount > 0) {
      addContribution({
        goalId: goal.id,
        amount,
        description: `Contribuição de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      });
      setContributionAmount("");
      setIsAddingContribution(false);
    }
  };

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getIconForType(goal.goal_type)}
            </div>
            <div>
              <CardTitle className="text-lg">{goal.description || getTypeLabel(goal.goal_type)}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(goal.goal_type)}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso</span>
            <Badge className={getStatusColor(status)}>
              {getStatusLabel(status)}
            </Badge>
          </div>
          <Progress value={percentage} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(current)}</span>
            <span>{formatCurrency(target)}</span>
          </div>
          <div className="text-center text-sm font-medium">
            {percentage.toFixed(1)}% concluído
          </div>
        </div>

        {/* Informações detalhadas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {goal.target_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Meta para</div>
                <div className="text-muted-foreground">
                  {format(parseISO(goal.target_date), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
            </div>
          )}
          
          {daysRemaining > 0 && (
            <div>
              <div className="font-medium">Dias restantes</div>
              <div className="text-muted-foreground">{daysRemaining} dias</div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Faltam</div>
              <div className="text-muted-foreground">{formatCurrency(target - current)}</div>
            </div>
          </div>
          
          {monthlyTarget > 0 && (
            <div>
              <div className="font-medium">Meta mensal</div>
              <div className="text-muted-foreground">{formatCurrency(monthlyTarget)}</div>
            </div>
          )}
        </div>

        {/* Contribuição mensal definida */}
        {goal.monthly_contribution && goal.monthly_contribution > 0 && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">Contribuição mensal: </span>
              {formatCurrency(goal.monthly_contribution)}
            </div>
          </div>
        )}

        {/* Botão para adicionar contribuição */}
        {status !== "achieved" && (
          <Dialog open={isAddingContribution} onOpenChange={setIsAddingContribution}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Contribuição
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Contribuição</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Valor da Contribuição (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingContribution(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddContribution}
                    disabled={isLoading || !contributionAmount || parseFloat(contributionAmount) <= 0}
                    className="flex-1"
                  >
                    {isLoading ? "Adicionando..." : "Confirmar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
