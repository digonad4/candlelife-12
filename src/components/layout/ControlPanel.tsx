
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, 
  Receipt, 
  Users, 
  FileText, 
  Wallet, 
  MessageSquare, 
  Settings,
  LogOut
} from "lucide-react";
import { NotificationBadge } from "../ui/notification-badge";
import { useMessages } from "@/hooks/useMessages";

interface ControlPanelProps {
  openChat: (userId: string, userName: string, userAvatar?: string) => void;
}

export const ControlPanel = ({ openChat }: ControlPanelProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { getTotalUnreadCount } = useMessages();
  const totalUnreadMessages = getTotalUnreadCount();

  const handleNavigation = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="w-full bg-background border-b border-border p-4">
      <div className="container mx-auto">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button 
            variant="outline" 
            onClick={() => handleNavigation("/dashboard")}
            className="flex items-center gap-2"
          >
            <LayoutDashboard size={18} />
            <span className="hidden md:inline">Dashboard</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => handleNavigation("/transactions")}
            className="flex items-center gap-2"
          >
            <Receipt size={18} />
            <span className="hidden md:inline">Transações</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => handleNavigation("/clients")}
            className="flex items-center gap-2"
          >
            <Users size={18} />
            <span className="hidden md:inline">Clientes</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => handleNavigation("/invoiced")}
            className="flex items-center gap-2"
          >
            <FileText size={18} />
            <span className="hidden md:inline">Faturados</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => handleNavigation("/expenses")}
            className="flex items-center gap-2"
          >
            <Wallet size={18} />
            <span className="hidden md:inline">Despesas</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => handleNavigation("/social")}
            className="flex items-center gap-2 relative"
          >
            <MessageSquare size={18} />
            <span className="hidden md:inline">Comunidade</span>
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-xs font-bold h-5 w-5">
                {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
              </span>
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => handleNavigation("/settings")}
            className="flex items-center gap-2"
          >
            <Settings size={18} />
            <span className="hidden md:inline">Configurações</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Sair</span>
          </Button>

          <div className="ml-2">
            <NotificationBadge openChat={openChat} />
          </div>
        </div>
      </div>
    </div>
  );
};
