
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { GoalsManager } from "@/components/goals/GoalsManager";
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Lightbulb,
  BarChart3,
  DollarSign,
  PiggyBank,
  Trophy
} from "lucide-react";
import { subMonths, format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function EnhancedFinancialInsights() {
  const [showGoals, setShowGoals] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const { data: transactions = [], isLoading } = useFinancialData();
  const { goals } = useGoals();
  const goalProgress = useGoalProgress(goals);
  
  const currentDate = useMemo(() => new Date(), []);

  const insights = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const currentMonth = startOfMonth(currentDate);
    const currentMonthEnd = endOfMonth(currentDate);
    const lastMonth = startOfMonth(subMonths(currentDate, 1));
    const lastMonthEnd = endOfMonth(subMonths(currentDate, 1));

    const currentMonthTxs = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: currentMonth, end: currentMonthEnd })
    );
    
    const lastMonthTxs = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: lastMonth, end: lastMonthEnd })
    );

    const currentExpenses = currentMonthTxs
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const lastExpenses = lastMonthTxs
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const currentIncome = currentMonthTxs
      .filter(t => t.type === "income" && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + t.amount, 0);

    const insights: any[] = [];

    // Goal-based insights
    goalProgress.forEach(progress => {
      const { goal, current, target, percentage, status } = progress;
      
      if (status === "exceeded") {
        insights.push({
          type: "goal_alert",
          title: `Meta Excedida: ${goal.category || "Geral"}`,
          description: `Você gastou ${formatCurrency(current)} de ${formatCurrency(target)} (${Math.round(percentage)}%)`,
          action: "Considere reduzir gastos nesta categoria pelo resto do mês",
          impact: "high",
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        });
      } else if (status === "warning") {
        insights.push({
          type: "goal_warning",
          title: `Atenção na Meta: ${goal.category || "Geral"}`,
          description: `Você já gastou ${Math.round(percentage)}% da sua meta mensal`,
          action: "Monitore seus gastos para não exceder o limite",
          impact: "medium",
          icon: <Target className="h-5 w-5 text-yellow-500" />,
        });
      } else if (status === "achieved" && goal.goal_type.includes("target")) {
        insights.push({
          type: "goal_achieved",
          title: `Meta Atingida! 🎉`,
          description: `Você alcançou sua meta de ${goal.goal_type.includes("income") ? "receita" : "poupança"}`,
          impact: "low",
          icon: <Trophy className="h-5 w-5 text-green-500" />,
        });
      }
    });

    // Traditional insights
    if (currentExpenses > lastExpenses * 1.2) {
      const increase = Math.round((currentExpenses / lastExpenses - 1) * 100);
      insights.push({
        type: "expense_increase",
        title: "Aumento de Gastos",
        description: `Seus gastos subiram ${increase}% em relação ao mês passado`,
        action: "Analise onde foi o aumento e considere ajustes",
        impact: "high",
        icon: <TrendingUp className="h-5 w-5 text-red-500" />,
      });
    }

    if (currentIncome > 0) {
      const savingsRate = (currentIncome - currentExpenses) / currentIncome;
      if (savingsRate < 0.1) {
        insights.push({
          type: "savings_low",
          title: "Taxa de Poupança Baixa",
          description: `Você está poupando apenas ${Math.round(savingsRate * 100)}% da sua renda`,
          action: "Tente economizar pelo menos 20% da sua renda mensal",
          impact: "medium",
          icon: <PiggyBank className="h-5 w-5 text-yellow-500" />,
        });
      } else if (savingsRate >= 0.3) {
        insights.push({
          type: "savings_good",
          title: "Excelente Poupança! 👏",
          description: `Você está poupando ${Math.round(savingsRate * 100)}% da sua renda`,
          action: "Continue assim e considere investir o excedente",
          impact: "low",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
      }
    }

    // Sort by impact
    return insights.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }, [transactions, goalProgress, currentDate]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Insights Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Analisando seus dados...</p>
        </CardContent>
      </Card>
    );
  }

  if (showGoals) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => setShowGoals(false)}
          className="mb-4"
        >
          ← Voltar aos Insights
        </Button>
        <GoalsManager />
      </div>
    );
  }

  const displayedInsights = expanded ? insights : insights.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Insights Financeiros Inteligentes
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowGoals(true)}>
            <Target className="h-4 w-4 mr-2" />
            Gerenciar Metas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 && (
          <Alert className="border-l-4 border-l-blue-500">
            <Target className="h-4 w-4" />
            <AlertTitle>Defina suas metas financeiras</AlertTitle>
            <AlertDescription>
              Crie metas para receber insights personalizados sobre seu progresso financeiro.
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal text-primary"
                onClick={() => setShowGoals(true)}
              >
                Criar primeira meta →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {insights.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="font-medium">Tudo sob controle!</h3>
            <p className="text-sm text-muted-foreground">
              Suas finanças estão equilibradas. Continue assim!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedInsights.map((insight, idx) => (
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
            
            {insights.length > 3 && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Ver menos" : `Ver mais ${insights.length - 3} insights`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
