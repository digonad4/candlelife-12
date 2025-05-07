
import { useMemo } from 'react';

export function useElectron() {
  const isElectron = useMemo(() => window.electron !== undefined, []);
  const platform = useMemo(() => window.electron?.platform || 'web', []);
  
  return {
    isElectron,
    platform,
    openFile: async () => {
      if (!isElectron) return null;
      return window.electron?.openFile();
    }
  };
}
