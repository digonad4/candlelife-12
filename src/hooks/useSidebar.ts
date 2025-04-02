
import { useContext } from "react";
import { useSidebar as useShadcnSidebar } from "@/components/ui/sidebar";

export interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isMobile?: boolean;
}

export const useSidebar = () => {
  // Usando useShadcnSidebar diretamente já que é um hook que retorna o contexto
  const context = useShadcnSidebar();
  
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  
  // Cast do contexto para o tipo esperado com as propriedades que precisamos
  const { state, toggleSidebar, isMobile } = context;
  
  // Mapear a propriedade state para isSidebarOpen para compatibilidade
  const isSidebarOpen = state === "expanded";
  
  return { isSidebarOpen, toggleSidebar, isMobile };
};
