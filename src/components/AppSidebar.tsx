
import { useState, useEffect } from "react";
import { Home, Settings, Wallet, Menu as MenuIcon, LogOut, ChevronDown, Users, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent as BaseSidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

export function AppSidebar() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<{ username?: string; avatar_url?: string } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  console.log('isMobile:', isMobile);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('Usuário autenticado:', user);
        if (userError) throw userError;
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single();
          console.log('Dados do perfil:', data);
          if (error) throw error;
          if (data) {
            setProfile(data);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error.message);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao fazer logout:", error.message);
    }
  };

  const menuItems = [
    { title: "Dashboard", icon: Home, url: "/" },
    { title: "Transações", icon: Wallet, url: "/transactions" },
    { title: "Clientes", icon: Users, url: "/clients" },
    { title: "Faturadas", icon: FileText, url: "/invoiced-transactions" },
    { title: "Configurações", icon: Settings, url: "/settings" },
  ];

  // Close the sheet when navigating to a new route
  useEffect(() => {
    setIsSheetOpen(false);
  }, [location.pathname]);

  const MenuContent = () => (
    <Sidebar className="border-r bg-card h-full">
      <BaseSidebarContent className="flex flex-col h-full">
        <SidebarGroup className="flex-grow">
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={location.pathname === item.url ? "bg-accent" : ""}
                  >
                    <Link to={item.url} className="flex items-center w-full gap-2">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile ? (
          <div className="p-4 border-t mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <Avatar className="mr-2">
                    <AvatarImage src={profile.avatar_url} alt={profile.username} />
                    <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[120px]">{profile.username}</span>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full">Editar Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="p-4 border-t mt-auto">Carregando perfil...</div>
        )}
      </BaseSidebarContent>
    </Sidebar>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="fixed top-4 left-4 z-50 bg-background shadow-md"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 overflow-y-auto">
            <MenuContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return <MenuContent />;
}
