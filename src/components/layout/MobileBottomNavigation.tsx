
import { Home, CreditCard, Receipt, Users, MessageSquare, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useMessageQueries } from "@/hooks/messages/useMessageQueries";
import { useChatUsersQuery } from "@/hooks/messages/queries/useChatUsersQuery";

export const MobileBottomNavigation = () => {
  const location = useLocation();
  const { getChatUsers } = useChatUsersQuery();
  const { getTotalUnreadCount } = useMessageQueries();

  const { data: chatUsers = [] } = getChatUsers();
  const totalUnreadCount = getTotalUnreadCount(chatUsers);

  const navigationItems = [
    { 
      path: "/dashboard", 
      icon: Home, 
      label: "Dashboard" 
    },
    { 
      path: "/transactions", 
      icon: CreditCard, 
      label: "Transações" 
    },
    { 
      path: "/expenses", 
      icon: Receipt, 
      label: "Despesas" 
    },
    { 
      path: "/clients", 
      icon: Users, 
      label: "Clientes" 
    },
    { 
      path: "/social", 
      icon: MessageSquare, 
      label: "Social",
      badge: totalUnreadCount > 0 ? totalUnreadCount : undefined
    },
    { 
      path: "/settings", 
      icon: Settings, 
      label: "Config" 
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="grid grid-cols-6 h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center text-xs transition-colors relative ${
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5 mb-1" />
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs"
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </Badge>
                )}
              </div>
              <span className="truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
