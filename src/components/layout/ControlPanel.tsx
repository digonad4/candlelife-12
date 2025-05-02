
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
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border shadow-sm">
      <div className="container mx-auto py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-primary hidden md:block">Candle Life</h1>
          </div>

          <nav className="flex flex-wrap gap-2 justify-center">
            <Button 
              variant="ghost" 
              onClick={() => handleNavigation("/dashboard")}
              className="flex items-center gap-2"
              size="sm"
            >
              <LayoutDashboard size={18} />
              <span className="hidden md:inline">Dashboard</span>
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => handleNavigation("/transactions")}
              className="flex items-center gap-2"
              size="sm"
            >
              <Receipt size={18} />
              <span className="hidden md:inline">Transações</span>
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => handleNavigation("/clients")}
              className="flex items-center gap-2"
              size="sm"
            >
              <Users size={18} />
              <span className="hidden md:inline">Clientes</span>
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => handleNavigation("/invoiced")}
              className="flex items-center gap-2"
              size="sm"
            >
              <FileText size={18} />
              <span className="hidden md:inline">Faturados</span>
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => handleNavigation("/expenses")}
              className="flex items-center gap-2"
              size="sm"
            >
              <Wallet size={18} />
              <span className="hidden md:inline">Despesas</span>
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => handleNavigation("/social")}
              className="flex items-center gap-2 relative"
              size="sm"
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
              variant="ghost" 
              onClick={() => handleNavigation("/settings")}
              className="flex items-center gap-2"
              size="sm"
            >
              <Settings size={18} />
              <span className="hidden md:inline">Configurações</span>
            </Button>
          </nav>

          <div className="flex items-center space-x-2">
            <NotificationBadge openChat={openChat} />
            
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="flex items-center gap-2"
              size="sm"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
