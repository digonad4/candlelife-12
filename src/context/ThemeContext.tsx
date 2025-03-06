
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark" | "cyberpunk" | "dracula" | "nord" | "purple" | "green";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => null,
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
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // If user is authenticated, save their preference to their profile
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ active_theme: newTheme })
          .eq('id', user.id);
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
