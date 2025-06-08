
import React, { createContext, useContext, useEffect } from 'react';
import { realtimeManager } from '@/services/RealtimeManager';

interface RealtimeContextValue {
  manager: typeof realtimeManager;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      realtimeManager.cleanup();
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ manager: realtimeManager }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
};
