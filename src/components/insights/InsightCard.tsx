
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRightCircle } from "lucide-react";
import { InsightItem } from "@/types/insights";

interface InsightCardProps {
  insight: InsightItem;
}

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <Alert
      className={`transition-all hover:shadow-md ${
        insight.impact === "high"
          ? "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/10"
          : insight.impact === "medium"
          ? "border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/10"
          : "border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {insight.icon}
        </div>
        <div className="flex-1">
          <AlertTitle className="font-semibold mb-1">{insight.title}</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            {insight.description}
            {insight.action && (
              <div className="mt-2 flex items-center gap-1.5">
                <ArrowRightCircle className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{insight.action}</span>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
