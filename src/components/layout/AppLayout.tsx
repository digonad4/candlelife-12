
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
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
          {/* Header with sidebar trigger for desktop */}
          {!isMobile && (
            <header className="flex h-12 items-center border-b px-4">
              <SidebarTrigger />
            </header>
          )}
          <main className={`flex-1 overflow-auto p-4 ${isMobile ? 'pb-20' : ''} ${!isMobile ? 'pt-0' : ''}`}>
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      {isMobile && <MobileBottomNavigation />}
    </SidebarProvider>
  );
};

export default AppLayout;
