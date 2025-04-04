
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
  const { state, toggleSidebar: originalToggle } = context;
  
  // Map to more intuitive property name
  const isSidebarOpen = state === "expanded";

  // Enhanced toggle function with mobile awareness
  const toggleSidebar = () => {
    if (!isMobile) {
      setWasPreviouslyOpen(!isSidebarOpen);
    }
    originalToggle();
  };

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      originalToggle();
    }
  }, [isMobile, isSidebarOpen, originalToggle]);
  
  return { isSidebarOpen, toggleSidebar, isMobile };
};
