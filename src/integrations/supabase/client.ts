
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const SUPABASE_URL = "https://vddpxkoycgawgdapigvl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZHB4a295Y2dhd2dkYXBpZ3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4MDM4MzUsImV4cCI6MjA1NDM3OTgzNX0.2hudtSXcnmmLb1d9_I_6H7AWhI9Y_9p8PYkV7sIjgt0";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        setItem: (key, value) => {
          localStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (key) => {
          localStorage.removeItem(key);
        },
      },
    },
  }
);

// Fix para o erro no SessionsManager.tsx
export const getDeviceIcon = (deviceInfo: string) => {
  if (deviceInfo.toLowerCase().includes("android") || 
      deviceInfo.toLowerCase().includes("iphone") || 
      deviceInfo.toLowerCase().includes("ios")) {
    return "mobile";
  }
  return "desktop";
};

export const formatSessionDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};
