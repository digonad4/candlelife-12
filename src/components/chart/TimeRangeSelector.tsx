
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimeRangeSelectorProps {
  timeRange: string;
  onTimeRangeChange: (timeRange: string) => void;
}

export function TimeRangeSelector({ timeRange, onTimeRangeChange }: TimeRangeSelectorProps) {
  const ranges = [
    { value: "individual", label: "P", tooltip: "Por Transação" },
    { value: "daily", label: "D", tooltip: "Diário" },
    { value: "weekly", label: "S", tooltip: "Semanal" },
    { value: "monthly", label: "M", tooltip: "Mensal" },
    { value: "yearly", label: "A", tooltip: "Anual" },
  ];

  return (
    <div className="flex space-x-2">
      <TooltipProvider>
        {ranges.map((range) => (
          <Tooltip key={range.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onTimeRangeChange(range.value)}
                className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded border border-gray-300 dark:border-gray-600 transition-colors ${
                  timeRange === range.value
                    ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white border-blue-500 dark:border-blue-700"
                    : "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {range.label}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{range.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
