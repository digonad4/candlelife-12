
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { MobileBottomNavigation } from "./MobileBottomNavigation";
import { Footer } from "./Footer";
import { NotificationPermissionBanner } from "@/components/notifications/NotificationPermissionBanner";
import { GlobalNotificationCenter } from "@/components/notifications/GlobalNotificationCenter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNative } from "@/hooks/useNative";
import { useMobileNative } from "@/hooks/useMobileNative";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const AppLayout = () => {
  const isMobile = useIsMobile();
  const { isNative, hapticFeedback } = useNative();
  const { safeAreaInsets, applySafeAreaPadding, isKeyboardOpen } = useMobileNative();
  const location = useLocation();

  // Check if current route is a chat page
  const isChatPage = location.pathname.startsWith('/chat/');

  // Add haptic feedback for native mobile interactions
  useEffect(() => {
    if (isNative && isMobile) {
      const handleTouchStart = () => {
        hapticFeedback('light');
      };

      // Add passive listener to avoid blocking scroll
      document.addEventListener('touchstart', handleTouchStart, { 
        passive: true,
        capture: false 
      });

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
      };
    }
  }, [isNative, isMobile, hapticFeedback]);

  // Apply native styling classes
  const containerClasses = [
    'flex h-screen w-full',
    isNative ? 'native-app' : '',
    isNative ? 'overflow-hidden' : '',
  ].filter(Boolean).join(' ');

  const mainClasses = [
    'flex-1 overflow-auto min-h-0',
    isMobile 
      ? isChatPage 
        ? 'pb-0' // No bottom padding for chat pages
        : isKeyboardOpen 
          ? 'pb-0' // No padding when keyboard is open
          : 'pb-24 pt-2' // Normal padding for other pages
      : 'pb-16', // Bottom padding for desktop footer
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'min-h-full',
    !isMobile && !isChatPage ? 'p-4' : isChatPage ? '' : 'p-2 pt-4'
  ].filter(Boolean).join(' ');

  return (
    <SidebarProvider>
      <div className={containerClasses} style={isNative ? applySafeAreaPadding('all') : {}}>
        {!isMobile && <AppSidebar />}
        
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          {/* Header with sidebar trigger for desktop and safe area for mobile */}
          {!isMobile && (
            <header 
              className="flex h-12 items-center border-b px-4 flex-shrink-0 justify-between"
              style={isNative ? applySafeAreaPadding('top') : {}}
            >
              <SidebarTrigger />
              <GlobalNotificationCenter />
            </header>
          )}
          
          {/* Main content with proper safe areas and mobile spacing */}
          <main className={mainClasses}>
            <div className={contentClasses}>
              <Outlet />
            </div>
          </main>

          {/* Footer - only on desktop and not on chat pages */}
          {!isMobile && !isChatPage && (
            <div className="absolute bottom-0 left-0 right-0">
              <Footer />
            </div>
          )}
        </SidebarInset>
      </div>
      
      {/* Mobile Bottom Navigation - hide on chat pages and when keyboard is open */}
      {isMobile && !isChatPage && !isKeyboardOpen && (
        <div style={isNative ? applySafeAreaPadding('bottom') : {}}>
          <MobileBottomNavigation />
        </div>
      )}
      
      {/* Notification Permission Banner */}
      <NotificationPermissionBanner />

      {/* Mobile Notification Center - Floating Action - hide on chat pages */}
      {isMobile && !isChatPage && (
        <div 
          className="fixed top-4 right-4 z-40"
          style={isNative ? { top: `calc(1rem + var(--safe-area-inset-top))` } : {}}
        >
          <GlobalNotificationCenter />
        </div>
      )}
    </SidebarProvider>
  );
};

export default AppLayout;
