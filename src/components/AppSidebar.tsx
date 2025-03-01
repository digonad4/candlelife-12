
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ReceiptText, User, Settings, DollarSign } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <Sidebar collapsible="offcanvas" className="block">
        <SidebarHeader className="flex h-14 items-center border-b px-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            <span className="text-lg font-semibold">FinApp</span>
          </div>
          <div className="flex-1" />
          <SidebarTrigger className="md:hidden" />
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/")}
                    isActive={isActive("/")}
                  >
                    <Home />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/transactions")}
                    isActive={isActive("/transactions")}
                  >
                    <ReceiptText />
                    <span>Transações</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/clients")}
                    isActive={isActive("/clients")}
                  >
                    <User />
                    <span>Clientes</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/settings")}
                    isActive={isActive("/settings")}
                  >
                    <Settings />
                    <span>Configurações</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="border-t p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.email}</span>
            <span className="text-xs text-muted-foreground">Usuário logado</span>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
