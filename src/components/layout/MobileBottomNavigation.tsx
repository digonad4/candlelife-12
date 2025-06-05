
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CreditCard, Target, Users, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mainNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: CreditCard, label: "Transações", href: "/transactions" },
    { icon: Target, label: "Metas", href: "/goals" },
    { icon: Users, label: "Clientes", href: "/clients" },
    { icon: MessageSquare, label: "Social", href: "/social" },
  ];

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
      <nav className="flex justify-around items-center py-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 transition-colors min-w-[60px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-1", isActive && "text-primary")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="flex flex-col items-center justify-center p-2 transition-colors min-w-[60px] text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Mais</span>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <Link
                to="/settings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                onClick={() => setIsDrawerOpen(false)}
              >
                <Settings className="h-5 w-5" />
                <span>Configurações</span>
              </Link>
            </div>
          </DrawerContent>
        </Drawer>
      </nav>
    </div>
  );
};
