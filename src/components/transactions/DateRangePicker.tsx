
import { format, parseISO, differenceInMonths, subDays, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DayPicker } from "react-day-picker";
import { useToast } from "@/components/ui/use-toast";
import "react-day-picker/dist/style.css";

interface DateRange {
  start: string;
  end: string;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();

  const handleRangeSelect = (range: { from: Date; to: Date } | undefined) => {
    if (!range || !range.from || !range.to) return;

    const start = parseISO(format(range.from, "yyyy-MM-dd"));
    const end = parseISO(format(range.to, "yyyy-MM-dd"));

    if (differenceInMonths(end, start) > 2) {
      toast({
        title: "Erro",
        description: "O período não pode exceder 2 meses.",
        variant: "destructive",
      });
      return;
    }

    onDateRangeChange({
      start: format(range.from, "yyyy-MM-dd"),
      end: format(range.to, "yyyy-MM-dd"),
    });
    setIsCalendarOpen(false);
  };

  const setYesterday = () => {
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    onDateRangeChange({ start: yesterday, end: yesterday });
  };

  const setLastWeek = () => {
    const end = format(new Date(), "yyyy-MM-dd");
    const start = format(subWeeks(new Date(), 1), "yyyy-MM-dd");
    onDateRangeChange({ start, end });
  };

  const setLast15Days = () => {
    const end = format(new Date(), "yyyy-MM-dd");
    const start = format(subDays(new Date(), 14), "yyyy-MM-dd");
    onDateRangeChange({ start, end });
  };

  return (
    <div className="mb-6 flex flex-wrap justify-center items-center gap-2 sm:gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={setYesterday}
        className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-sm py-1 px-2"
      >
        Ontem
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={setLastWeek}
        className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-sm py-1 px-2"
      >
        Última Semana
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={setLast15Days}
        className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-sm py-1 px-2"
      >
        Últimos 15 Dias
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-sm py-1 px-2"
      >
        Calendário
      </Button>
      {isCalendarOpen && (
        <div className="absolute z-10 mt-40 p-4 bg-muted border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <DayPicker
            mode="range"
            selected={{ from: parseISO(dateRange.start), to: parseISO(dateRange.end) }}
            onSelect={handleRangeSelect}
            locale={ptBR}
            className="rounded-lg"
            modifiers={{
              disabled: (date: Date) => differenceInMonths(date, new Date()) > 2,
            }}
            styles={{
              head: { 
                background: "#e5e7eb", 
                borderRadius: "8px 8px 0 0",
                color: "#1f2937" // Cinza escuro para texto
              },
              day: { borderRadius: "4px" },
              table: { background: "transparent" },
            }}
            classNames={{
              tbody: "bg-green-100 text-green-900 dark:bg-green-700 dark:text-green-100",
              caption: "text-lg font-medium text-gray-800 dark:text-gray-200",
              nav_button: "text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400",
              cell: "text-gray-800 dark:text-gray-200", // Texto dos dias
            }}
            footer={
              <Button
                variant="ghost"
                onClick={() => setIsCalendarOpen(false)}
                className="mt-2 w-full text-sm text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
              >
                Fechar
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
