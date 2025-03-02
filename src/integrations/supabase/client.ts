
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vddpxkoycgawgdapigvl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZHB4a295Y2dhd2dkYXBpZ3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4MDM4MzUsImV4cCI6MjA1NDM3OTgzNX0.2hudtSXcnmmLb1d9_I_6H7AWhI9Y_9p8PYkV7sIjgt0";

// Criamos a instância do cliente apenas uma vez
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
          try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
          } catch (error) {
            console.error("Error reading from localStorage:", error);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            window.localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.error("Error writing to localStorage:", error);
          }
        },
        removeItem: (key) => {
          try {
            window.localStorage.removeItem(key);
          } catch (error) {
            console.error("Error removing from localStorage:", error);
          }
        },
      },
    },
  }
);
