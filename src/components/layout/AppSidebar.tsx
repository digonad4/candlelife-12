
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
  LogOut,
  Menu
} from "lucide-react";
import { NotificationBadge } from "../ui/notification-badge";
import { useMessages } from "@/hooks/useMessages";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/drawer";

interface AppSidebarProps {
  openChat: (userId: string, userName: string, userAvatar?: string) => void;
}

export const AppSidebar = ({ openChat }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { getTotalUnreadCount } = useMessages();
  const totalUnreadMessages = getTotalUnreadCount();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const handleNavigation = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
    if (isMobile) {
      setIsOpen(false); // Close mobile sidebar after navigation
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const NavItem = ({ 
    icon: Icon, 
    label, 
    path, 
    badge = null 
  }: { 
    icon: React.ElementType; 
    label: string; 
    path: string; 
    badge?: number | null 
  }) => (
    <Button 
      variant="ghost" 
      onClick={() => handleNavigation(path)}
      className="w-full justify-start mb-1"
    >
      <div className="flex items-center w-full relative">
        <Icon size={18} className="mr-2" />
        <span>{label}</span>
        {badge !== null && badge > 0 && (
          <span className="absolute right-0 top-0 bg-destructive text-destructive-foreground rounded-full text-xs font-bold h-5 w-5 flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
    </Button>
  );

  // Mobile sidebar using Sheet component
  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-background flex items-center justify-between border-b">
        <h1 className="text-xl font-bold text-primary">Candle Life</h1>
        
        <div className="flex gap-2">
          <NotificationBadge openChat={openChat} />
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="flex flex-col h-full bg-sidebar">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Menu</h2>
                </div>
                
                <div className="flex-1 overflow-auto p-4">
                  <nav className="space-y-1">
                    <NavItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" />
                    <NavItem icon={Receipt} label="Transações" path="/transactions" />
                    <NavItem icon={Users} label="Clientes" path="/clients" />
                    <NavItem icon={FileText} label="Faturados" path="/invoiced" />
                    <NavItem icon={Wallet} label="Despesas" path="/expenses" />
                    <NavItem icon={MessageSquare} label="Comunidade" path="/social" badge={totalUnreadMessages} />
                    <NavItem icon={Settings} label="Configurações" path="/settings" />
                  </nav>
                </div>
                
                <div className="p-4 border-t mt-auto">
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="w-full justify-start"
                  >
                    <LogOut size={18} className="mr-2" />
                    <span>Sair</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div className="w-64 h-screen fixed left-0 top-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-primary">Candle Life</h1>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <nav className="space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" />
          <NavItem icon={Receipt} label="Transações" path="/transactions" />
          <NavItem icon={Users} label="Clientes" path="/clients" />
          <NavItem icon={FileText} label="Faturados" path="/invoiced" />
          <NavItem icon={Wallet} label="Despesas" path="/expenses" />
          <NavItem icon={MessageSquare} label="Comunidade" path="/social" badge={totalUnreadMessages} />
          <NavItem icon={Settings} label="Configurações" path="/settings" />
        </nav>
      </div>
      
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center justify-between mb-4">
          <NotificationBadge openChat={openChat} />
        </div>
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start"
        >
          <LogOut size={18} className="mr-2" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
};
