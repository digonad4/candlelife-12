
import { useState, useEffect } from "react";
import { useSidebar as useShadcnSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Custom hook for sidebar state management
 * Wraps the shadcn sidebar hook with additional functionality
 */
export const useSidebar = () => {
  // Get the base sidebar context
  const context = useShadcnSidebar();
  const isMobile = useIsMobile();
  const [wasPreviouslyOpen, setWasPreviouslyOpen] = useState(false);
  
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  
  // Extract and rename properties from context
  const { state, toggleSidebar: originalToggle, setOpenMobile, openMobile } = context;
  
  // Map to more intuitive property name
  const isSidebarOpen = state === "expanded";

  // Enhanced toggle function with mobile awareness
  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      setWasPreviouslyOpen(!isSidebarOpen);
      originalToggle();
    }
  };

  // Auto-collapse sidebar on mobile when navigating away
  useEffect(() => {
    if (isMobile && openMobile) {
      // Adiciona um event listener para detectar cliques fora do sidebar
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && !target.closest('[data-sidebar="sidebar"]') && !target.closest('button[aria-label="Toggle Sidebar"]')) {
          setOpenMobile(false);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isMobile, openMobile, setOpenMobile]);
  
  return { 
    isSidebarOpen: isMobile ? openMobile : isSidebarOpen, 
    toggleSidebar, 
    isMobile 
  };
};
