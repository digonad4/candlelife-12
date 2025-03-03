
import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function usePeriodLabel(startDate?: Date, endDate?: Date) {
  return useMemo(() => {
    if (!startDate || !endDate) {
      return "todas as transações";
    }
    
    const startDateFormatted = format(startDate, "dd/MM/yyyy", { locale: ptBR });
    const endDateFormatted = format(endDate, "dd/MM/yyyy", { locale: ptBR });
    
    if (startDateFormatted === endDateFormatted) {
      return `${startDateFormatted}`;
    }
    
    return `${startDateFormatted} até ${endDateFormatted}`;
  }, [startDate, endDate]);
}
