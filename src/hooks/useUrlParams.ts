
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

/**
 * Hook para gerenciar parâmetros de URL relacionados a datas
 */
export function useUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Função para obter o período a partir da URL
  const getDateRangeFromUrl = (): string => {
    return searchParams.get('period') || 'today';
  };
  
  // Função para obter as datas a partir da URL
  const getDatesFromUrl = (): { startDate?: Date; endDate?: Date } => {
    const startDateStr = searchParams.get('start');
    const endDateStr = searchParams.get('end');
    
    return {
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
    };
  };
  
  // Função para atualizar o período na URL
  const updateDateRangeInUrl = (dateRange: string): void => {
    searchParams.set('period', dateRange);
    if (dateRange !== 'custom') {
      // Se não for período personalizado, removemos datas específicas
      searchParams.delete('start');
      searchParams.delete('end');
    }
    setSearchParams(searchParams);
  };
  
  // Função para atualizar as datas na URL
  const updateDatesInUrl = (startDate?: Date, endDate?: Date): void => {
    if (startDate) {
      searchParams.set('start', format(startDate, 'yyyy-MM-dd'));
    } else {
      searchParams.delete('start');
    }
    
    if (endDate) {
      searchParams.set('end', format(endDate, 'yyyy-MM-dd'));
    } else {
      searchParams.delete('end');
    }
    
    setSearchParams(searchParams);
  };
  
  return {
    getDateRangeFromUrl,
    getDatesFromUrl,
    updateDateRangeInUrl,
    updateDatesInUrl
  };
}
