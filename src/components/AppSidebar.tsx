
import { useState } from "react";
import { Home, PlusCircle, Settings, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ExpenseModal } from "@/components/ExpenseModal";
import { useQueryClient } from "@tanstack/react-query";

export function AppSidebar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

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

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      {item.onClick ? (
                        <button onClick={item.onClick} className="flex items-center w-full">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </button>
                      ) : (
                        <Link to={item.url!} className="flex items-center w-full">
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
        </SidebarContent>
      </Sidebar>

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
