
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { PiggyBank, TrendingUp, AlertTriangle, CheckCircle, Target, Calendar } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface SavingsGoalsInsightsProps {
  onGoToGoals: () => void;
}

interface Insight {
  type: string;
  title: string;
  description: string;
  action?: string;
  impact: "low" | "medium" | "high";
  icon: JSX.Element;
}

export function SavingsGoalsInsights({ onGoToGoals }: SavingsGoalsInsightsProps) {
  const { goals } = useGoals();
  const goalProgress = useGoalProgress(goals);

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Metas de Poupança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-l-4 border-l-blue-500">
            <PiggyBank className="h-4 w-4" />
            <AlertTitle>Comece a poupar com metas</AlertTitle>
            <AlertDescription>
              Defina metas de poupança para seus objetivos e acompanhe seu progresso.
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal text-primary ml-2"
                onClick={onGoToGoals}
              >
                Criar primeira meta →
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const achievements = goalProgress.filter(p => p.status === "achieved");
  const onTrackGoals = goalProgress.filter(p => p.status === "on_track");
  const warningGoals = goalProgress.filter(p => p.status === "warning");
  const behindGoals = goalProgress.filter(p => p.status === "behind");

  const totalSaved = goalProgress.reduce((sum, p) => sum + p.current, 0);
  const totalTarget = goalProgress.reduce((sum, p) => sum + p.target, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const insights: Insight[] = [];

  // Insights de conquistas
  if (achievements.length > 0) {
    insights.push({
      type: "achievement",
      title: `🎉 ${achievements.length} Meta${achievements.length > 1 ? 's' : ''} Conquistada${achievements.length > 1 ? 's' : ''}!`,
      description: `Parabéns! Você já alcançou ${formatCurrency(achievements.reduce((sum, p) => sum + p.target, 0))} em metas.`,
      impact: "low",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    });
  }

  // Insights de metas atrasadas
  if (behindGoals.length > 0) {
    const behindGoal = behindGoals[0];
    insights.push({
      type: "behind",
      title: "Atenção: Meta Atrasada",
      description: `Sua meta "${behindGoal.goal.description || 'Meta'}" precisa de mais ${formatCurrency(behindGoal.monthlyTarget)} por mês para ficar em dia.`,
      action: "Considere ajustar a contribuição mensal ou revisar a data alvo.",
      impact: "high",
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    });
  }

  // Insights de metas em alerta
  if (warningGoals.length > 0) {
    const warningGoal = warningGoals[0];
    insights.push({
      type: "warning",
      title: "Meta Próxima do Prazo",
      description: `Sua meta "${warningGoal.goal.description || 'Meta'}" tem apenas ${warningGoal.daysRemaining} dias restantes.`,
      action: `Considere aumentar as contribuições para ${formatCurrency(warningGoal.monthlyTarget)} por mês.`,
      impact: "medium",
      icon: <Calendar className="h-5 w-5 text-yellow-500" />,
    });
  }

  // Insight de progresso geral
  if (overallProgress >= 70) {
    insights.push({
      type: "progress",
      title: "Excelente Progresso! 📈",
      description: `Você já poupou ${overallProgress.toFixed(1)}% do total das suas metas (${formatCurrency(totalSaved)} de ${formatCurrency(totalTarget)}).`,
      impact: "low",
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
    });
  } else if (overallProgress < 30) {
    insights.push({
      type: "encouragement",
      title: "Hora de Acelerar ⚡",
      description: `Você está com ${overallProgress.toFixed(1)}% das suas metas. Pequenas contribuições regulares fazem grande diferença!`,
      action: "Defina contribuições automáticas para facilitar o processo.",
      impact: "medium",
      icon: <PiggyBank className="h-5 w-5 text-blue-500" />,
    });
  }

  // Próximas metas a vencer
  const nearDeadline = goalProgress.filter(p => 
    p.daysRemaining > 0 && p.daysRemaining <= 90 && p.status !== "achieved"
  ).sort((a, b) => a.daysRemaining - b.daysRemaining);

  if (nearDeadline.length > 0) {
    const nextGoal = nearDeadline[0];
    insights.push({
      type: "deadline",
      title: "Meta Próxima do Prazo",
      description: `"${nextGoal.goal.description || 'Meta'}" vence em ${nextGoal.daysRemaining} dias.`,
      action: `Para atingir a meta, contribua com ${formatCurrency(nextGoal.monthlyTarget)} por mês.`,
      impact: "medium",
      icon: <Target className="h-5 w-5 text-orange-500" />,
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-blue-500" />
            Insights das Metas de Poupança
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onGoToGoals}>
            Ver Metas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo Geral */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{achievements.length}</div>
              <div className="text-xs text-muted-foreground">Conquistadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{onTrackGoals.length}</div>
              <div className="text-xs text-muted-foreground">No Caminho</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{overallProgress.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Progresso Total</div>
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights.length === 0 ? (
          <div className="text-center py-4">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Continue poupando para ver insights personalizados!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, idx) => (
              <Alert
                key={idx}
                className={
                  insight.impact === "high"
                    ? "border-l-4 border-l-red-500"
                    : insight.impact === "medium"
                    ? "border-l-4 border-l-yellow-500"
                    : "border-l-4 border-l-green-500"
                }
              >
                <div className="flex items-start gap-3">
                  {insight.icon}
                  <div className="flex-1">
                    <AlertTitle className="font-semibold">{insight.title}</AlertTitle>
                    <AlertDescription className="mt-1">
                      {insight.description}
                      {insight.action && (
                        <p className="mt-2 font-medium text-primary">{insight.action}</p>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
