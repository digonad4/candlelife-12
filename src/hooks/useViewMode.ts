
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useViewMode(userId: string | undefined) {
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const { toast } = useToast();

  useEffect(() => {
    const fetchViewMode = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("view_mode")
          .eq("id", userId)
          .single();
          
        if (error) {
          console.error("Erro ao carregar view_mode:", error);
          return;
        }
        
        if (data && data.view_mode) {
          setViewMode(data.view_mode as "list" | "table");
        }
      } catch (error) {
        console.error("Erro ao buscar view_mode:", error);
      }
    };
    
    fetchViewMode();
  }, [userId]);

  const saveViewMode = async (newMode: "list" | "table") => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ view_mode: newMode })
        .eq("id", userId);
        
      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao salvar preferência de visualização.",
          variant: "destructive",
        });
        console.error("Erro ao salvar view_mode:", error);
      }
    } catch (error) {
      console.error("Erro ao atualizar view_mode:", error);
    }
  };

  const toggleViewMode = () => {
    const newMode = viewMode === "list" ? "table" : "list";
    setViewMode(newMode);
    saveViewMode(newMode);
    return newMode;
  };

  return { viewMode, toggleViewMode };
}
