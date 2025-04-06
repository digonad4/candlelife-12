
import { useState, useEffect } from "react";
import { useShadcnSidebar } from "@/components/ui/sidebar"; 
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";

/**
 * Custom hook for sidebar state management
 * Wraps the shadcn sidebar hook with additional functionality
 */
export const useSidebar = () => {
  const context = useShadcnSidebar();
  const isMobile = useIsMobile();
  const [wasPreviouslyOpen, setWasPreviouslyOpen] = useState(false);
  const location = useLocation();

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  const { state, toggleSidebar: originalToggle, setOpenMobile, openMobile } = context;
  // Handling sidebar state consistently across devices
  const isSidebarOpen = openMobile || state === "expanded";

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      setWasPreviouslyOpen(isSidebarOpen);
      originalToggle();
    }
  };

  useEffect(() => {
    // Apply behavior for clicks outside the sidebar for all devices
    if (openMobile || state === "expanded") {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          target &&
          !target.closest('[data-sidebar="sidebar"]') &&
          !target.closest('button[aria-label="Toggle Sidebar"]')
        ) {
          if (isMobile) {
            setOpenMobile(false);
          } else {
            // For desktop, only close if sidebar is expanded
            if (state === "expanded") {
              originalToggle();
            }
          }
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isMobile, openMobile, setOpenMobile, state, originalToggle]);

  // Only reset mobile sidebar on full page navigation
  // but preserve sidebar state across URL parameter changes
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);

  return {
    isSidebarOpen,
    toggleSidebar,
    isMobile,
    wasPreviouslyOpen,
  };
};
