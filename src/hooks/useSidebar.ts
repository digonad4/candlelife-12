
import { useContext } from "react";
import { useSidebar as useShadcnSidebar } from "@/components/ui/sidebar";

export const useSidebar = () => {
  const context = useContext(useShadcnSidebar);
  
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  
  return context;
};
