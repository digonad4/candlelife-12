
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, Users, FileText, Settings, LogOut } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function AppSidebar() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <aside className={`sidebar fixed inset-y-0 left-0 z-10 bg-card border-r border-border
      transition-all duration-300 ease-in-out overflow-hidden shadow-md 
      ${isSidebarOpen ? "w-64" : "w-16"}`}>
      <div className="sidebar-header py-4 px-4 flex items-center justify-between">
        <h1 className={`text-lg font-bold transition-opacity duration-300
          ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Dashboard</h1>
        <Button variant="ghost" size="sm" className="h-8 w-8" onClick={toggleSidebar}>
          ☰
        </Button>
      </div>
      
      <TooltipProvider>
        <nav className="sidebar-nav mt-4">
          <ul className="space-y-2 px-2">
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `flex items-center p-3 rounded-md transition-colors
                      ${isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent/50"}
                      ${!isSidebarOpen && "justify-center"}`
                    }
                  >
                    <LayoutDashboard size={20} />
                    <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Dashboard</span>
                  </NavLink>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    Dashboard
                  </TooltipContent>
                )}
              </Tooltip>
            </li>
            
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/transactions"
                    className={({ isActive }) =>
                      `flex items-center p-3 rounded-md transition-colors
                      ${isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent/50"}
                      ${!isSidebarOpen && "justify-center"}`
                    }
                  >
                    <Receipt size={20} />
                    <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Transações</span>
                  </NavLink>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    Transações
                  </TooltipContent>
                )}
              </Tooltip>
            </li>
            
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/clients"
                    className={({ isActive }) =>
                      `flex items-center p-3 rounded-md transition-colors
                      ${isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent/50"}
                      ${!isSidebarOpen && "justify-center"}`
                    }
                  >
                    <Users size={20} />
                    <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Clientes</span>
                  </NavLink>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    Clientes
                  </TooltipContent>
                )}
              </Tooltip>
            </li>
            
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/invoiced"
                    className={({ isActive }) =>
                      `flex items-center p-3 rounded-md transition-colors
                      ${isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent/50"}
                      ${!isSidebarOpen && "justify-center"}`
                    }
                  >
                    <FileText size={20} />
                    <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Faturados</span>
                  </NavLink>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    Faturados
                  </TooltipContent>
                )}
              </Tooltip>
            </li>
            
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      `flex items-center p-3 rounded-md transition-colors
                      ${isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent/50"}
                      ${!isSidebarOpen && "justify-center"}`
                    }
                  >
                    <Settings size={20} />
                    <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Configurações</span>
                  </NavLink>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    Configurações
                  </TooltipContent>
                )}
              </Tooltip>
            </li>
            
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className={`flex items-center p-3 rounded-md transition-colors
                      w-full text-left text-foreground hover:bg-accent/50
                      ${!isSidebarOpen && "justify-center"}`} 
                    onClick={handleLogout}
                  >
                    <LogOut size={20} />
                    <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Sair</span>
                  </button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    Sair
                  </TooltipContent>
                )}
              </Tooltip>
            </li>
          </ul>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
