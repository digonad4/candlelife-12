
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, Users, FileText, Settings, LogOut } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-md transition-colors
                ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}
                ${!isSidebarOpen && "justify-center"}`
              }
            >
              <LayoutDashboard size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/transactions"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-md transition-colors
                ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}
                ${!isSidebarOpen && "justify-center"}`
              }
            >
              <Receipt size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Transações</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/clients"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-md transition-colors
                ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}
                ${!isSidebarOpen && "justify-center"}`
              }
            >
              <Users size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Clientes</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/invoiced"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-md transition-colors
                ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}
                ${!isSidebarOpen && "justify-center"}`
              }
            >
              <FileText size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Faturados</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-md transition-colors
                ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}
                ${!isSidebarOpen && "justify-center"}`
              }
            >
              <Settings size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Configurações</span>
            </NavLink>
          </li>
          <li>
            <button 
              className={`flex items-center p-3 rounded-md transition-colors
                w-full text-left text-sidebar-foreground hover:bg-sidebar-accent/50
                ${!isSidebarOpen && "justify-center"}`} 
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Sair</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
