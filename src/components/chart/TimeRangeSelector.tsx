
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TimeRangeSelectorProps {
  timeRange: string;
  onTimeRangeChange: (timeRange: string) => void;
}

export function TimeRangeSelector({ timeRange, onTimeRangeChange }: TimeRangeSelectorProps) {
  const ranges = [
    { 
      value: "individual", 
      label: "P", 
      tooltip: "Por Transação", 
      description: "Mostra cada transação individualmente"
    },
    { 
      value: "daily", 
      label: "D", 
      tooltip: "Diário", 
      description: "Agrupa transações por dia"
    },
    { 
      value: "weekly", 
      label: "S", 
      tooltip: "Semanal", 
      description: "Agrupa transações por semana"
    },
    { 
      value: "monthly", 
      label: "M", 
      tooltip: "Mensal", 
      description: "Agrupa transações por mês" 
    },
    { 
      value: "yearly", 
      label: "A", 
      tooltip: "Anual", 
      description: "Agrupa transações por ano"
    },
  ];

  return (
    <div className="flex space-x-2">
      <TooltipProvider delayDuration={300}>
        {ranges.map((range) => (
          <Tooltip key={range.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onTimeRangeChange(range.value)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center text-xs font-medium rounded-md border transition-all duration-200",
                  timeRange === range.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
                )}
                aria-label={range.tooltip}
              >
                {range.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-3 max-w-[200px]">
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{range.tooltip}</p>
                <p className="text-xs text-muted-foreground">{range.description}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
