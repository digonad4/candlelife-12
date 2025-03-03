
import React from "react";

interface TimeRangeSelectorProps {
  timeRange: string;
  onTimeRangeChange: (timeRange: string) => void;
}

export function TimeRangeSelector({ timeRange, onTimeRangeChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex flex-wrap justify-center mt-4 space-x-2">
      <button
        onClick={() => onTimeRangeChange("individual")}
        className={`px-3 py-1 text-sm rounded ${
          timeRange === "individual"
            ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white"
            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        Padrão
      </button>
      <button
        onClick={() => onTimeRangeChange("daily")}
        className={`px-3 py-1 text-sm rounded ${
          timeRange === "daily"
            ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white"
            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        Diário
      </button>
      <button
        onClick={() => onTimeRangeChange("weekly")}
        className={`px-3 py-1 text-sm rounded ${
          timeRange === "weekly"
            ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white"
            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        Semanal
      </button>
      <button
        onClick={() => onTimeRangeChange("monthly")}
        className={`px-3 py-1 text-sm rounded ${
          timeRange === "monthly"
            ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white"
            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        Mensal
      </button>
      <button
        onClick={() => onTimeRangeChange("yearly")}
        className={`px-3 py-1 text-sm rounded ${
          timeRange === "yearly"
            ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-white"
            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        Anual
      </button>
    </div>
  );
}
