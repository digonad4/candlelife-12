
import { useMemo } from 'react';

/**
 * Hook to interact with Electron functionality
 * @returns Object with Electron-related utilities and state
 */
export function useElectron() {
  // Check if running in Electron environment
  const isElectron = useMemo(() => {
    return false; // Always false since we're not using Electron
  }, []);
  
  // Get platform information (always 'web' since we're not using Electron)
  const platform = useMemo(() => {
    return 'web';
  }, []);
  
  /**
   * Open a file dialog and return the selected file path
   * @returns Promise with null since not available in web
   */
  const openFile = async () => {
    console.log('File dialog is not available in web environment');
    return null;
  };

  return {
    isElectron,
    platform,
    openFile
  };
}
