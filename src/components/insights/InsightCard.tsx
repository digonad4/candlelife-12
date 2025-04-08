
import { InsightItem } from "@/hooks/useFinancialInsights";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  TrendingDown, TrendingUp, AlertCircle, Lightbulb, PiggyBank, 
  Target, DollarSign, BarChart2, Calendar, ShoppingBag, CreditCard
} from "lucide-react";

interface InsightCardProps {
  insight: InsightItem;
}

export function InsightCard({ insight }: InsightCardProps) {
  // Map insight types to icons
  const getIcon = () => {
    switch (insight.type) {
      case "budget":
        return <Target className="h-5 w-5 text-blue-500" />;
      case "expense":
        return insight.impact === "high" ? 
          <TrendingUp className="h-5 w-5 text-red-500" /> : 
          <TrendingDown className="h-5 w-5 text-green-500" />;
      case "income":
        return insight.impact === "high" ? 
          <TrendingDown className="h-5 w-5 text-yellow-500" /> : 
          <TrendingUp className="h-5 w-5 text-green-500" />;
      case "trend":
        return <BarChart2 className="h-5 w-5 text-blue-500" />;
      case "savings":
        return <PiggyBank className="h-5 w-5 text-blue-500" />;
      case "recurring":
        return <Calendar className="h-5 w-5 text-yellow-500" />;
      case "cashflow":
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case "opportunity":
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };

  const icon = insight.icon || getIcon();
  
  return (
    <Alert
      className={
        insight.impact === "high"
          ? "border-l-4 border-l-red-500"
          : insight.impact === "medium"
          ? "border-l-4 border-l-yellow-500"
          : "border-l-4 border-l-green-500"
      }
    >
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1">
          <AlertTitle className="font-semibold">{insight.title}</AlertTitle>
          <AlertDescription className="mt-1">
            {insight.description}
            {insight.action && <p className="mt-2 font-medium text-primary">{insight.action}</p>}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
