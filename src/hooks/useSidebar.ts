
import { useState, useEffect } from "react";
import { useShadcnSidebar } from "@/components/ui/sidebar"; 
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Custom hook for sidebar state management
 * Wraps the shadcn sidebar hook with additional functionality
 */
export const useSidebar = () => {
  const context = useShadcnSidebar();
  const isMobile = useIsMobile();
  const [wasPreviouslyOpen, setWasPreviouslyOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  // Função de navegação simplificada e direta
  const navigateTo = (path: string) => {
    console.log("Navegando para:", path);
    
    // Fecha o sidebar móvel se estiver aberto
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
    
    // Pequeno atraso para garantir que a navegação ocorra após qualquer animação
    setTimeout(() => {
      // Use o navigate diretamente do react-router para navegar
      navigate(path);
    }, 10);
  };

  // Adiciona click fora para fechar sidebar
  useEffect(() => {
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
          } else if (state === "expanded") {
            originalToggle();
          }
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isMobile, openMobile, setOpenMobile, state, originalToggle]);

  // Redefine o estado do sidebar móvel em navegações completas de página
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
    navigateTo,
  };
};
