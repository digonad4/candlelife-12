
import { useState, useEffect } from "react";
import { useShadcnSidebar } from "@/components/ui/sidebar"; 
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Custom hook for sidebar state management
 * Wraps the shadcn sidebar hook with additional functionality
 */
export const useSidebar = () => {
  const context = useShadcnSidebar();
  const isMobile = useIsMobile();
  const [wasPreviouslyOpen, setWasPreviouslyOpen] = useState(false);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  const { state, toggleSidebar: originalToggle, setOpenMobile, openMobile } = context;
  
  // Determine if sidebar is open based on device type
  const isSidebarOpen = isMobile ? openMobile : state === "expanded";

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      setWasPreviouslyOpen(isSidebarOpen);
      originalToggle();
    }
  };

  useEffect(() => {
    // Handle click outside to close sidebar
    if (isSidebarOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          target &&
          !target.closest('[data-sidebar="sidebar"]') &&
          !target.closest('button[aria-label="Toggle Sidebar"]') &&
          !target.closest('button[aria-label="Close Sidebar"]')
        ) {
          if (isMobile) {
            setOpenMobile(false);
          }
          // For desktop, we don't auto-close on outside click to avoid UX issues
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isMobile, openMobile, setOpenMobile, isSidebarOpen]);

  return {
    isSidebarOpen,
    toggleSidebar,
    isMobile,
    wasPreviouslyOpen,
  };
};
