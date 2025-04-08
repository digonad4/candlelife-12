
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InsightCard } from "./InsightCard";
import { InsightItem } from "@/hooks/useFinancialInsights";

interface InsightsListProps {
  insights: InsightItem[];
}

export function InsightsList({ insights }: InsightsListProps) {
  const [expanded, setExpanded] = useState(false);
  const displayedInsights = expanded ? insights : insights.slice(0, 3);

  return (
    <div className="space-y-4">
      {displayedInsights.map((insight, idx) => (
        <InsightCard key={idx} insight={insight} />
      ))}
      
      {insights.length > 3 && (
        <Button variant="outline" className="w-full mt-2" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Ver menos" : `Ver mais ${insights.length - 3} insights`}
        </Button>
      )}
    </div>
  );
}
