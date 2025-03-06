
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, Users, FileText, Settings, LogOut } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function AppSidebar() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const renderNavItem = (icon: React.ElementType, label: string, to: string) => {
    const Icon = icon;
    
    return (
      <li>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex items-center p-3 rounded-md transition-colors
                ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}
                ${!isSidebarOpen && "justify-center"}`
              }
            >
              <TooltipTrigger asChild>
                <span className={`flex items-center ${isSidebarOpen ? 'w-full' : ''}`}>
                  <Icon size={20} className={isSidebarOpen ? "mr-3" : ""} />
                  {isSidebarOpen && <span>{label}</span>}
                </span>
              </TooltipTrigger>
              {!isSidebarOpen && (
                <TooltipContent side="right">
                  <p>{label}</p>
                </TooltipContent>
              )}
            </NavLink>
          </Tooltip>
        </TooltipProvider>
      </li>
    );
  };

  return (
    <aside className={`sidebar bg-sidebar ${isSidebarOpen ? "w-64" : "w-16"} fixed inset-y-0 left-0 z-10 
      transition-width duration-300 ease-in-out overflow-hidden shadow-md 
      border-r border-sidebar-border`}>
      <div className="sidebar-header py-4 px-4 flex items-center justify-between">
        <h1 className={`text-lg font-bold ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} 
          transition-opacity duration-300`}>Dashboard</h1>
        <button className="sidebar-toggle p-2 rounded-md hover:bg-sidebar-accent" onClick={toggleSidebar}>
          ☰
        </button>
      </div>
      <nav className="sidebar-nav mt-4">
        <ul className="space-y-2 px-2">
          {renderNavItem(LayoutDashboard, "Dashboard", "/dashboard")}
          {renderNavItem(Receipt, "Transações", "/transactions")}
          {renderNavItem(Users, "Clientes", "/clients")}
          {renderNavItem(FileText, "Faturados", "/invoiced")}
          {renderNavItem(Settings, "Configurações", "/settings")}
          
          <li>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <button 
                  className={`flex items-center p-3 rounded-md transition-colors
                    w-full text-left text-sidebar-foreground hover:bg-sidebar-accent/50
                    ${!isSidebarOpen && "justify-center"}`} 
                  onClick={handleLogout}
                >
                  <TooltipTrigger asChild>
                    <span className={`flex items-center ${isSidebarOpen ? 'w-full' : ''}`}>
                      <LogOut size={20} className={isSidebarOpen ? "mr-3" : ""} />
                      {isSidebarOpen && <span>Sair</span>}
                    </span>
                  </TooltipTrigger>
                  {!isSidebarOpen && (
                    <TooltipContent side="right">
                      <p>Sair</p>
                    </TooltipContent>
                  )}
                </button>
              </Tooltip>
            </TooltipProvider>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
