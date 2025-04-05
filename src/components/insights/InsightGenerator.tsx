
import { 
  TrendingDown, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  PiggyBank, 
  Target, 
  DollarSign, 
  BarChart2,
  CreditCard,
  Calendar,
  ArrowUpDown,
  LineChart,
  BellRing,
  Landmark,
  BadgePercent,
  Coins
} from "lucide-react";
import { formatCurrency } from "@/utils/financialUtils";
import { FinancialData, InsightItem } from "@/types/insights";

export function generateInsights(financialData: FinancialData): InsightItem[] {
  const insights: InsightItem[] = [];
  
  const {
    currentMonthExpenses,
    lastMonthExpenses,
    currentMonthIncome,
    lastMonthIncome,
    projectedMonthlyExpense,
    remainingDays,
    categoryTrends,
    topCategories,
    months,
    currentMonthTxs,
    monthlySavingsRates
  } = financialData;

  // 1. Projeção de orçamento - Melhorada
  if (projectedMonthlyExpense > currentMonthIncome && currentMonthIncome > 0) {
    const deficit = projectedMonthlyExpense - currentMonthIncome;
    const dailyReduction = deficit / remainingDays;
    const deficitPercentage = Math.round((deficit / currentMonthIncome) * 100);
    
    insights.push({
      type: "budget",
      title: "Alerta de Déficit Orçamentário",
      description: `Sua projeção de gastos excede sua renda em ${formatCurrency(deficit)} (${deficitPercentage}% acima do sustentável).`,
      action: `Reduza ${formatCurrency(dailyReduction)} diários nos próximos ${remainingDays} dias para equilibrar seu orçamento.`,
      impact: "high",
      icon: <Target className="h-5 w-5 text-red-500" />,
    });
  } else if (currentMonthIncome > 0 && projectedMonthlyExpense < currentMonthIncome * 0.7) {
    // Adicionando insight positivo quando há boa margem orçamentária
    const surplus = currentMonthIncome - projectedMonthlyExpense;
    const surplusPercentage = Math.round((surplus / currentMonthIncome) * 100);
    
    insights.push({
      type: "budget",
      title: "Excelente Margem Orçamentária",
      description: `Você está projetando gastar apenas ${100 - surplusPercentage}% de sua renda, gerando um superávit de ${formatCurrency(surplus)}.`,
      action: `Considere direcionar ${formatCurrency(surplus * 0.7)} para investimentos de longo prazo e ${formatCurrency(surplus * 0.3)} para sua reserva de emergência.`,
      impact: "low",
      icon: <Target className="h-5 w-5 text-green-500" />,
    });
  }

  // 2. Tendência de despesas - Análise mais aprofundada
  if (months.length >= 2) {
    if (currentMonthExpenses > lastMonthExpenses * 1.2) {
      const percentIncrease = Math.round((currentMonthExpenses / lastMonthExpenses - 1) * 100);
      insights.push({
        type: "expense",
        title: "Aumento Significativo nas Despesas",
        description: `Seus gastos aumentaram ${percentIncrease}% em relação ao mês anterior (${formatCurrency(currentMonthExpenses)} vs ${formatCurrency(lastMonthExpenses)}).`,
        action: "Identifique as 3 categorias com maiores aumentos e estabeleça alertas automáticos de limite de gastos para o próximo mês.",
        impact: "high",
        icon: <TrendingUp className="h-5 w-5 text-red-500" />,
      });
    } else if (currentMonthExpenses < lastMonthExpenses * 0.8) {
      const percentDecrease = Math.round((1 - currentMonthExpenses / lastMonthExpenses) * 100);
      insights.push({
        type: "expense",
        title: "Redução Expressiva de Despesas",
        description: `Seus gastos diminuíram ${percentDecrease}% em relação ao mês anterior (${formatCurrency(currentMonthExpenses)} vs ${formatCurrency(lastMonthExpenses)}).`,
        action: "Mantenha a estratégia de economia e direcione esta diferença de ${formatCurrency(lastMonthExpenses - currentMonthExpenses)} para sua carteira de investimentos.",
        impact: "low",
        icon: <TrendingDown className="h-5 w-5 text-green-500" />,
      });
    }
  }

  // 3. Tendência de receita - Análise expandida
  if (months.length >= 2) {
    if (currentMonthIncome < lastMonthIncome * 0.9 && lastMonthIncome > 0) {
      const percentDrop = Math.round((1 - currentMonthIncome / lastMonthIncome) * 100);
      insights.push({
        type: "income",
        title: "Queda na Receita Mensal",
        description: `Sua renda caiu ${percentDrop}% comparado ao mês anterior (${formatCurrency(currentMonthIncome)} vs ${formatCurrency(lastMonthIncome)}).`,
        action: "Priorize despesas essenciais e revise categorias discricionárias. Considere cortes temporários em assinaturas e entretenimento.",
        impact: "high",
        icon: <TrendingDown className="h-5 w-5 text-yellow-500" />,
      });
    } else if (currentMonthIncome > lastMonthIncome * 1.1) {
      const percentRise = Math.round((currentMonthIncome / lastMonthIncome - 1) * 100);
      insights.push({
        type: "income",
        title: "Aumento Expressivo na Receita",
        description: `Sua renda cresceu ${percentRise}% em relação ao mês anterior (${formatCurrency(currentMonthIncome)} vs ${formatCurrency(lastMonthIncome)}).`,
        action: `Aplique a regra 50/30/20: ${formatCurrency(currentMonthIncome * 0.5)} para necessidades, ${formatCurrency(currentMonthIncome * 0.3)} para desejos e ${formatCurrency(currentMonthIncome * 0.2)} para investimentos.`,
        impact: "low",
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      });
    }
  }

  // 4. Tendência por categoria - Análise mais detalhada
  if (categoryTrends.length > 0) {
    const significantTrends = categoryTrends.filter(t => Math.abs(t.percentChange) > 25);
    if (significantTrends.length > 0) {
      const trend = significantTrends[0];
      const isIncrease = trend.trend > 0;
      insights.push({
        type: "trend",
        title: `${isIncrease ? "Aumento" : "Redução"} Crítico em ${trend.category}`,
        description: `Gastos em "${trend.category}" ${isIncrease ? "subiram" : "caíram"} ${Math.abs(Math.round(trend.percentChange))}% (${formatCurrency(trend.currentAmount)} vs ${formatCurrency(trend.previousAmount)}).`,
        action: isIncrease 
          ? `Estabeleça um orçamento máximo de ${formatCurrency(trend.previousAmount * 1.1)} para "${trend.category}" no próximo mês.` 
          : `Continue a estratégia de redução em "${trend.category}" e considere aplicar tática semelhante em outras categorias.`,
        impact: isIncrease ? "medium" : "low",
        icon: <LineChart className={`h-5 w-5 ${isIncrease ? "text-yellow-500" : "text-green-500"}`} />,
      });
    }
  }

  // 5. Análise de concentração de gastos - Nova análise
  if (topCategories.length > 0) {
    const [category, amount] = topCategories[0];
    const percentOfTotal = Math.round((amount / currentMonthExpenses) * 100);
    
    if (percentOfTotal > 40) {
      insights.push({
        type: "expense",
        title: `Alta Concentração de Gastos em ${category}`,
        description: `${formatCurrency(amount)} em "${category}" representa ${percentOfTotal}% do seu orçamento mensal, muito acima dos 30% recomendados.`,
        action: `Diversifique seus gastos e reduza gradualmente "${category}" para no máximo ${formatCurrency(currentMonthExpenses * 0.3)} nos próximos 2 meses.`,
        impact: "high",
        icon: <DollarSign className="h-5 w-5 text-red-500" />,
      });
    } else if (percentOfTotal > 30) {
      insights.push({
        type: "expense",
        title: `Concentração Elevada em ${category}`,
        description: `${formatCurrency(amount)} em "${category}" representa ${percentOfTotal}% do seu orçamento mensal.`,
        action: `Considere reduzir gastos em "${category}" em 10-15% nos próximos 2 meses para melhor equilíbrio financeiro.`,
        impact: "medium",
        icon: <DollarSign className="h-5 w-5 text-yellow-500" />,
      });
    }
  }

  // 6. Taxa de poupança inteligente - Análise mais precisa
  const savingsRatio = currentMonthIncome > 0 ? (currentMonthIncome - currentMonthExpenses) / currentMonthIncome : 0;
  if (currentMonthIncome > 0) {
    if (savingsRatio < 0) {
      insights.push({
        type: "savings",
        title: "Saldo Negativo Crítico",
        description: `Você está gastando ${formatCurrency(Math.abs(currentMonthIncome - currentMonthExpenses))} além da sua renda mensal.`,
        action: `Identifique imediatamente ${formatCurrency(Math.abs(currentMonthIncome - currentMonthExpenses))} em despesas que podem ser eliminadas ou adiadas.`,
        impact: "high",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } else if (savingsRatio < 0.1) {
      insights.push({
        type: "savings",
        title: "Taxa de Poupança Insuficiente",
        description: `Você está economizando apenas ${Math.max(0, Math.round(savingsRatio * 100))}% da sua renda (recomendado: mínimo 10%).`,
        action: `Analise despesas discricionárias para economizar pelo menos ${formatCurrency(currentMonthIncome * 0.1)} mensalmente como base de proteção financeira.`,
        impact: "medium",
        icon: <PiggyBank className="h-5 w-5 text-yellow-500" />,
      });
    } else if (savingsRatio >= 0.2) {
      // Check trend in savings rate if available
      let improvingText = "";
      if (monthlySavingsRates.length >= 2) {
        const currentRate = monthlySavingsRates[0].savingsRate;
        const previousRate = monthlySavingsRates[1].savingsRate;
        if (currentRate > previousRate + 0.05) {
          improvingText = " Sua taxa melhorou em relação ao mês anterior, ótimo trabalho!";
        }
      }
      
      insights.push({
        type: "savings",
        title: "Taxa de Poupança Otimizada",
        description: `Você está economizando ${Math.round(savingsRatio * 100)}% da sua renda (${formatCurrency(currentMonthIncome - currentMonthExpenses)}).${improvingText}`,
        action: "Distribua este valor entre reserva de emergência (30%), investimentos de médio prazo (40%) e longo prazo (30%) para maximizar seu patrimônio.",
        impact: "low",
        icon: <PiggyBank className="h-5 w-5 text-green-500" />,
      });
    }
  }

  // 7. Análise de dependência de renda recorrente vs. variável - Nova análise
  const recurringIncome = currentMonthTxs
    .filter(t => t.type === "income" && t.recurring && t.payment_status === "confirmed")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const variableIncome = currentMonthIncome - recurringIncome;
  
  if (currentMonthIncome > 0 && variableIncome / currentMonthIncome > 0.5) {
    insights.push({
      type: "income",
      title: "Alta Dependência de Renda Variável",
      description: `${Math.round((variableIncome / currentMonthIncome) * 100)}% da sua renda (${formatCurrency(variableIncome)}) vem de fontes variáveis/não-recorrentes.`,
      action: "Crie uma reserva de emergência maior, equivalente a 8-12 meses de despesas, para proteger-se da volatilidade de renda.",
      impact: "medium",
      icon: <ArrowUpDown className="h-5 w-5 text-yellow-500" />,
    });
  }

  // 8. Análise de liquidez - Nova análise
  const pendingIncome = currentMonthTxs
    .filter(t => t.type === "income" && t.payment_status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);
  
  if (pendingIncome > currentMonthIncome * 0.3) {
    insights.push({
      type: "opportunity",
      title: "Problema de Fluxo de Caixa",
      description: `Você tem ${formatCurrency(pendingIncome)} (${Math.round((pendingIncome / (currentMonthIncome + pendingIncome)) * 100)}% da receita total) em pagamentos pendentes.`,
      action: "Estabeleça prazos de pagamento mais curtos, ofereça descontos para pagamentos antecipados ou considere serviços de antecipação de recebíveis.",
      impact: "medium",
      icon: <Calendar className="h-5 w-5 text-yellow-500" />,
    });
  }

  // 9. Análise de despesas recorrentes - Análise mais precisa
  const recurringExpenses = currentMonthTxs
    .filter(t => t.type === "expense" && t.recurring)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  if (recurringExpenses > 0) {
    const recurringExpensesRatio = recurringExpenses / currentMonthExpenses;
    
    if (recurringExpensesRatio > 0.7) {
      insights.push({
        type: "opportunity",
        title: "Baixa Flexibilidade Orçamentária",
        description: `${Math.round(recurringExpensesRatio * 100)}% dos seus gastos são recorrentes (${formatCurrency(recurringExpenses)}), limitando sua capacidade de adaptação financeira.`,
        action: "Revise cada assinatura e serviço recorrente. Identifique 3-5 itens que podem ser eliminados ou renegociados imediatamente.",
        impact: "high",
        icon: <CreditCard className="h-5 w-5 text-red-500" />,
      });
    } else if (recurringExpensesRatio > 0.5 && recurringExpensesRatio <= 0.7) {
      insights.push({
        type: "opportunity",
        title: "Otimização de Despesas Fixas",
        description: `${Math.round(recurringExpensesRatio * 100)}% dos seus gastos são recorrentes (${formatCurrency(recurringExpenses)}).`,
        action: "Renegocie contratos anuais de serviços e considere pacotes combinados para reduzir o custo total em 10-15%.",
        impact: "medium",
        icon: <CreditCard className="h-5 w-5 text-yellow-500" />,
      });
    }
  }

  // 10. Índice de Eficiência Financeira - Nova análise sofisticada
  if (currentMonthIncome > 0 && months.length >= 3) {
    // Estimar um índice de eficiência com base em múltiplos fatores
    let efficiency = 0;
    
    // Fator 1: Taxa de poupança (peso: 40%)
    efficiency += (savingsRatio * 100 * 0.4); // 0-40 pontos
    
    // Fator 2: Estabilidade de gastos (peso: 20%)
    const expenseVolatility = lastMonthExpenses > 0 ? 
      Math.abs(1 - (currentMonthExpenses / lastMonthExpenses)) : 0;
    efficiency += (20 - (expenseVolatility * 100 > 20 ? 20 : expenseVolatility * 100)); // 0-20 pontos
    
    // Fator 3: Diversificação de gastos (peso: 20%)
    const topCategoryPercentage = topCategories.length > 0 ? 
      (topCategories[0][1] / currentMonthExpenses) : 0;
    efficiency += (20 - (topCategoryPercentage * 100 > 40 ? 20 : topCategoryPercentage * 50)); // 0-20 pontos
    
    // Fator 4: Dependência de renda fixa (peso: 20%)
    const recurringIncomeRatio = currentMonthIncome > 0 ? recurringIncome / currentMonthIncome : 0;
    efficiency += (recurringIncomeRatio * 100 * 0.2); // 0-20 pontos
    
    let efficiencyRating;
    let efficiencyImpact;
    let efficiencyIcon;
    let efficiencyAction;
    
    if (efficiency >= 75) {
      efficiencyRating = "Excelente";
      efficiencyImpact = "low";
      efficiencyIcon = <Coins className="h-5 w-5 text-green-500" />;
      efficiencyAction = "Continue sua estratégia atual, focando em ampliar seus investimentos para objetivos de longo prazo.";
    } else if (efficiency >= 60) {
      efficiencyRating = "Bom";
      efficiencyImpact = "low";
      efficiencyIcon = <Coins className="h-5 w-5 text-green-500" />;
      efficiencyAction = "Você está no caminho certo. Foque em aumentar sua taxa de poupança em 3-5% nos próximos meses.";
    } else if (efficiency >= 40) {
      efficiencyRating = "Regular";
      efficiencyImpact = "medium";
      efficiencyIcon = <Coins className="h-5 w-5 text-yellow-500" />;
      efficiencyAction = "Foque em aumentar sua taxa de poupança e diversificar melhor seus gastos para maior estabilidade financeira.";
    } else {
      efficiencyRating = "Necessita Atenção";
      efficiencyImpact = "high";
      efficiencyIcon = <Coins className="h-5 w-5 text-red-500" />;
      efficiencyAction = "Priorize aumentar sua reserva financeira e reduzir dependência de categorias específicas de gastos.";
    }
    
    insights.push({
      type: "opportunity",
      title: `Índice de Eficiência Financeira: ${efficiencyRating}`,
      description: `Sua pontuação de eficiência financeira é ${Math.round(efficiency)}/100, baseada em poupança, estabilidade, diversificação e segurança de renda.`,
      action: efficiencyAction,
      impact: efficiencyImpact as any,
      icon: efficiencyIcon,
    });
  }

  // 11. Oportunidade de investimento com base na idade - Nova análise
  if (savingsRatio >= 0.15) {
    insights.push({
      type: "opportunity",
      title: "Estratégia de Investimento Otimizada",
      description: `Com sua atual taxa de poupança de ${Math.round(savingsRatio * 100)}%, você tem uma excelente posição para investimentos estratégicos.`,
      action: "Considere a regra de 100 menos sua idade para alocação em renda variável, diversificando o restante entre renda fixa, imóveis e reserva de segurança.",
      impact: "low",
      icon: <Landmark className="h-5 w-5 text-green-500" />,
    });
  }

  // 12. Alerta de cartão de crédito - Nova análise
  const creditCardExpenses = currentMonthTxs
    .filter(t => t.type === "expense" && t.payment_method === "credit_card")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  if (creditCardExpenses > currentMonthIncome * 0.3) {
    insights.push({
      type: "expense",
      title: "Dependência Excessiva de Crédito",
      description: `Seus gastos com cartão de crédito (${formatCurrency(creditCardExpenses)}) representam ${Math.round((creditCardExpenses / currentMonthIncome) * 100)}% da sua renda mensal.`,
      action: "Limite o uso do cartão a 30% da renda e estabeleça um plano para quitar o saldo rotativo em até 3 meses.",
      impact: "high",
      icon: <CreditCard className="h-5 w-5 text-red-500" />,
    });
  }

  // 13. Alerta de juros e multas - Nova análise
  const lateFeesAndInterest = currentMonthTxs
    .filter(t => t.type === "expense" && (t.description.toLowerCase().includes("juro") || 
                                          t.description.toLowerCase().includes("multa") || 
                                          t.description.toLowerCase().includes("mora") ||
                                          t.category?.toLowerCase().includes("juro") ||
                                          t.category?.toLowerCase().includes("multa")))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  if (lateFeesAndInterest > 0) {
    insights.push({
      type: "expense",
      title: "Desperdício com Juros e Multas",
      description: `Você gastou ${formatCurrency(lateFeesAndInterest)} em juros e multas este mês, valor que poderia estar rendendo a seu favor.`,
      action: "Configure alertas de pagamento com 5 dias de antecedência para todas as contas e priorize a quitação de dívidas com juros altos.",
      impact: "high",
      icon: <BellRing className="h-5 w-5 text-red-500" />,
    });
  }

  // 14. Oportunidade tributária - Nova análise
  const taxDeductibleExpenses = currentMonthTxs
    .filter(t => t.type === "expense" && (t.category?.toLowerCase().includes("saúde") || 
                                          t.category?.toLowerCase().includes("educação") ||
                                          t.category?.toLowerCase().includes("previdência")))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  if (taxDeductibleExpenses > 0 && currentMonthIncome > 5000) {
    insights.push({
      type: "opportunity",
      title: "Otimização Fiscal Possível",
      description: `Você tem ${formatCurrency(taxDeductibleExpenses)} em despesas potencialmente dedutíveis (saúde, educação, previdência).`,
      action: "Organize os comprovantes dessas despesas para declaração de imposto e consulte sobre PGBL para dedução adicional de até 12% da renda tributável.",
      impact: "low",
      icon: <BadgePercent className="h-5 w-5 text-blue-500" />,
    });
  }

  // 15. Saúde financeira geral - Nova análise mais completa
  if (insights.filter(i => i.impact === "high").length === 0 && currentMonthIncome > 0 && savingsRatio > 0.2) {
    insights.push({
      type: "savings",
      title: "Saúde Financeira Excelente",
      description: "Seus indicadores financeiros estão equilibrados e dentro dos parâmetros recomendados para estabilidade e crescimento patrimonial.",
      action: "Continue sua estratégia atual e considere uma revisão trimestral de objetivos financeiros para acelerar o crescimento patrimonial.",
      impact: "low",
      icon: <Lightbulb className="h-5 w-5 text-green-500" />,
    });
  }

  // Ordenação por impacto
  return insights.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
}
