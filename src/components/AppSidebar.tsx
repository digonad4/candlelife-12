
import { useState } from "react";
import { Home, PlusCircle, Settings, Wallet, Menu as MenuIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent as BaseSidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ExpenseModal } from "@/components/ExpenseModal";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppSidebar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const location = useLocation();
  const isMobile = useIsMobile();

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      url: "/",
    },
    {
      title: "Nova Transação",
      icon: PlusCircle,
      onClick: () => setIsModalOpen(true),
    },
    {
      title: "Transações",
      icon: Wallet,
      url: "/transactions",
    },
    {
      title: "Configurações",
      icon: Settings,
      url: "/settings",
    },
  ];

  const MenuContent = () => (
    <Sidebar className="border-r bg-card">
      <BaseSidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={location.pathname === item.url ? "bg-accent" : ""}
                  >
                    {item.onClick ? (
                      <button onClick={item.onClick} className="flex items-center w-full gap-2">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </button>
                    ) : (
                      <Link to={item.url!} className="flex items-center w-full gap-2">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </BaseSidebarContent>
    </Sidebar>
  );

  if (isMobile) {
    return (
      <>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <MenuContent />
          </SheetContent>
        </Sheet>

        <ExpenseModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen}
          onTransactionAdded={() => {
            queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
          }}
        />
      </>
    );
  }

  return (
    <>
      <MenuContent />
      <ExpenseModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onTransactionAdded={() => {
          queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["expense-chart"] });
        }}
      />
    </>
  );
}
