import { useState, useEffect } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, startOfDay, endOfDay, subDays, subMonths, subYears, isBefore } from "date-fns";

export interface DateFilterProps {
  dateRange: string;
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (range: string) => void;
  onStartDateChange: (date?: Date) => void;
  onEndDateChange: (date?: Date) => void;
}

export function DateFilter({
  dateRange,
  startDate,
  endDate,
  onDateRangeChange,
  onStartDateChange,
  onEndDateChange,
}: DateFilterProps) {
  useEffect(() => {
    if (dateRange !== "custom") {
      const today = new Date();
      
      switch (dateRange) {
        case "today":
          onStartDateChange(startOfDay(today));
          onEndDateChange(endOfDay(today));
          break;
        case "last7days":
          onStartDateChange(startOfDay(subDays(today, 7))); // Início do dia há 7 dias
          onEndDateChange(endOfDay(today));                  // Fim do dia atual
          break;
        case "last30days":
          onStartDateChange(startOfDay(subDays(today, 30))); // Início do dia há 30 dias
          onEndDateChange(endOfDay(today));                   // Fim do dia atual
          break;
        case "last6months":
          onStartDateChange(startOfDay(subMonths(today, 6))); // Início do dia há 6 meses
          onEndDateChange(endOfDay(today));                    // Fim do dia atual
          break;
        case "lastyear":
          onStartDateChange(startOfDay(subYears(today, 1))); // Início do dia há 1 ano
          onEndDateChange(endOfDay(today));                   // Fim do dia atual
          break;
      }
    }
  }, [dateRange, onStartDateChange, onEndDateChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <Select value={dateRange} onValueChange={onDateRangeChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="last7days">Últimos 7 dias</SelectItem>
          <SelectItem value="last30days">Últimos 30 dias</SelectItem>
          <SelectItem value="last6months">Últimos 6 meses</SelectItem>
          <SelectItem value="lastyear">Último ano</SelectItem>
          <SelectItem value="custom">Período personalizado</SelectItem>
        </SelectContent>
      </Select>
      {dateRange === "custom" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <DatePicker
            placeholder="Data inicial"
            selected={startDate}
            onSelect={(date) => {
              if (date && endDate && isBefore(endDate, date)) {
                onEndDateChange(addDays(date, 1));
              }
              onStartDateChange(date);
            }}
            className="w-full sm:w-auto"
          />
          <DatePicker
            placeholder="Data final"
            selected={endDate}
            onSelect={onEndDateChange}
            className="w-full sm:w-auto"
          />
        </div>
      )}
    </div>
  );
}