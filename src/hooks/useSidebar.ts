
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
  // Aqui vamos tratar todos os dispositivos de modo consistente
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
    // Aplicando o comportamento de clique fora do sidebar para todos os dispositivos
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
            // Para desktop, só fechamos se o sidebar estiver expandido
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

  return {
    isSidebarOpen,
    toggleSidebar,
    isMobile,
    wasPreviouslyOpen,
  };
};
