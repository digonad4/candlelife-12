
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const updateOnlineStatus = async () => {
      try {
        // For now, we'll just update the updated_at timestamp to track activity
        // The is_online field would need to be added to the profiles table via SQL migration
        await supabase
          .from('profiles')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    updateOnlineStatus();

    // Update status every 30 seconds when online
    const interval = isOnline ? setInterval(updateOnlineStatus, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnline, user]);

  return isOnline;
}
