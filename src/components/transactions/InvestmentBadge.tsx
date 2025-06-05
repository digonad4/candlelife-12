
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InvestmentBadgeProps {
  amount: number;
  className?: string;
}

export function InvestmentBadge({ amount, className = "" }: InvestmentBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-blue-100 text-blue-700 border-blue-200 ${className}`}
    >
      <TrendingUp className="w-3 h-3 mr-1" />
      Investimento: {amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </Badge>
  );
}
