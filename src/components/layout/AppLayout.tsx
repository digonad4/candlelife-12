
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { MobileBottomNavigation } from "./MobileBottomNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

const AppLayout = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {!isMobile && <AppSidebar />}
        <SidebarInset className="flex-1">
          <main className={`flex-1 overflow-auto p-4 ${isMobile ? 'pb-20' : ''}`}>
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      {isMobile && <MobileBottomNavigation />}
    </SidebarProvider>
  );
};

export default AppLayout;
