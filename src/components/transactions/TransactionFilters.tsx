
import { useState } from "react";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TransactionFiltersProps {
  dateRange: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  searchTerm: string;
  onDateRangeChange: (range: string) => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onSearchChange: (term: string) => void;
  onPrintExtract: () => void;
}

export function TransactionFilters({
  dateRange,
  startDate,
  endDate,
  searchTerm,
  onDateRangeChange,
  onStartDateChange,
  onEndDateChange,
  onSearchChange,
  onPrintExtract,
}: TransactionFiltersProps) {
  return (
    <div className="space-y-4">
      <DateFilter
        dateRange={dateRange}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
      />
      <div className="flex justify-between items-center">
        <Input
          type="text"
          placeholder="Pesquisar por cliente, descrição, valor ou data..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full md:w-1/2"
        />
        <Button onClick={onPrintExtract}>Imprimir Extrato</Button>
      </div>
    </div>
  );
}
