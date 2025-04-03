
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark" | "cyberpunk" | "dracula" | "nord" | "purple" | "green" | "ocean" | "sunset" | "forest" | "coffee" | "pastel" | "neon" | "vintage" | "midnight" | "royal";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  isUpdating: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: async () => { /* void return instead of null */ },
  isUpdating: false,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "light"
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Load user's theme preference from Supabase when signed in
  useEffect(() => {
    const loadUserTheme = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('active_theme')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          
          if (data && data.active_theme) {
            setThemeState(data.active_theme as Theme);
            localStorage.setItem("theme", data.active_theme);
          }
        } catch (error) {
          console.error("Error loading user theme:", error);
        }
      }
    };

    loadUserTheme();
  }, [user]);

  // Update both localStorage and state
  const setTheme = useCallback(async (newTheme: Theme) => {
    setIsUpdating(true);
    
    try {
      setThemeState(newTheme);
      localStorage.setItem("theme", newTheme);
      
      // If user is authenticated, save their preference to their profile
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ active_theme: newTheme })
          .eq('id', user.id);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving theme preference:", error);
    } finally {
      setIsUpdating(false);
    }
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isUpdating }}>
      {children}
    </ThemeContext.Provider>
  );
};
