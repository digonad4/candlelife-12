
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CreditCard, Target, Users, MessageSquare, Settings, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNative } from "@/hooks/useNative";
import { useAdvancedMessages } from "@/hooks/useAdvancedMessages";
import { Badge } from "@/components/ui/badge";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useState } from "react";

export const MobileBottomNavigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { hapticFeedback } = useNative();
  const { totalUnreadMessages } = useAdvancedMessages();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mainNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: CreditCard, label: "Transações", href: "/transactions" },
    { icon: Target, label: "Metas", href: "/goals" },
    { icon: Users, label: "Clientes", href: "/clients" },
    { 
      icon: MessageSquare, 
      label: "Chat", 
      href: "/chat",
      badge: totalUnreadMessages > 0 ? (totalUnreadMessages > 99 ? "99+" : totalUnreadMessages.toString()) : undefined
    },
  ];

  const handleNavClick = () => {
    hapticFeedback('light');
  };

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-t border-border/50 safe-area-bottom">
      <nav className="flex justify-around items-center py-2 px-4">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href === "/chat" && location.pathname.startsWith("/chat"));
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center p-3 transition-all duration-200 rounded-xl min-w-[60px] native-transition relative",
                isActive 
                  ? "text-primary bg-primary/10 scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95"
              )}
            >
              <div className="relative">
                <item.icon className={cn(
                  "h-5 w-5 mb-1 transition-transform duration-200", 
                  isActive && "scale-110"
                )} />
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs min-w-[16px] text-[10px]"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                isActive ? "font-semibold" : "font-normal"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
        
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <button 
              onClick={handleNavClick}
              className="flex flex-col items-center justify-center p-3 transition-all duration-200 rounded-xl min-w-[60px] text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95 native-transition"
            >
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Mais</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="bg-background/95 backdrop-blur-md border-t border-border/50">
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-2 pb-8">
              <Link
                to="/social"
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-accent/50 transition-all duration-200 active:scale-95 native-transition"
                onClick={() => {
                  handleNavClick();
                  setIsDrawerOpen(false);
                }}
              >
                <Globe className="h-5 w-5" />
                <span className="font-medium">Comunidade</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-accent/50 transition-all duration-200 active:scale-95 native-transition"
                onClick={() => {
                  handleNavClick();
                  setIsDrawerOpen(false);
                }}
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Configurações</span>
              </Link>
              <Link
                to="/expenses"
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-accent/50 transition-all duration-200 active:scale-95 native-transition"
                onClick={() => {
                  handleNavClick();
                  setIsDrawerOpen(false);
                }}
              >
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Despesas</span>
              </Link>
              <Link
                to="/invoiced"
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-accent/50 transition-all duration-200 active:scale-95 native-transition"
                onClick={() => {
                  handleNavClick();
                  setIsDrawerOpen(false);
                }}
              >
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Faturadas</span>
              </Link>
            </div>
          </DrawerContent>
        </Drawer>
      </nav>
    </div>
  );
};
