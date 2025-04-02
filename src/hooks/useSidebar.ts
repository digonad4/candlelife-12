
import { useContext } from "react";
import { useSidebar as useShadcnSidebar } from "@/components/ui/sidebar";

export interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useSidebar = () => {
  // Using useShadcnSidebar directly since it's already a hook that returns the context
  const context = useShadcnSidebar();
  
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  
  // Cast the context to our expected type with the properties we need
  const { state, toggleSidebar } = context;
  
  // Map the state property to isSidebarOpen for backward compatibility
  const isSidebarOpen = state === "expanded";
  
  return { isSidebarOpen, toggleSidebar };
};
