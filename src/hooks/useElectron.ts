
import { useMemo } from 'react';

/**
 * Hook to interact with Electron functionality
 * @returns Object with Electron-related utilities and state
 */
export function useElectron() {
  // Check if running in Electron environment
  const isElectron = useMemo(() => {
    return window.electron !== undefined;
  }, []);
  
  // Get platform information (win32, darwin, linux, or web)
  const platform = useMemo(() => {
    return window.electron?.platform || 'web';
  }, []);
  
  /**
   * Open a file dialog and return the selected file path
   * @returns Promise with the selected file path or null
   */
  const openFile = async () => {
    if (!isElectron) {
      console.log('File dialog can only be opened in Electron environment');
      return null;
    }
    
    try {
      return await window.electron?.openFile();
    } catch (error) {
      console.error('Error opening file dialog:', error);
      return null;
    }
  };

  return {
    isElectron,
    platform,
    openFile
  };
}
