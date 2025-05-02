
import { Outlet } from "react-router-dom";
import { Toaster } from "../ui/toaster";
import { useState, useEffect } from "react";
import { ChatModal } from "../social/ChatModal";
import { AppSidebar } from "./AppSidebar";

const AppLayout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState({ id: "", name: "", avatar: "" });
  const [isMobile, setIsMobile] = useState(false);
  
  // Function to open chat from anywhere in the app
  const openChat = (userId: string, userName: string, userAvatar?: string) => {
    setChatRecipient({
      id: userId,
      name: userName,
      avatar: userAvatar || ""
    });
    setIsChatOpen(true);
  };

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Listen for custom event to open chat
  useEffect(() => {
    const handleOpenChatEvent = (event: CustomEvent) => {
      const { userId, userName, userAvatar } = event.detail;
      openChat(userId, userName, userAvatar);
    };

    window.addEventListener("open-chat" as any, handleOpenChatEvent as EventListener);

    return () => {
      window.removeEventListener("open-chat" as any, handleOpenChatEvent as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground w-full">
      <AppSidebar openChat={openChat} />
      
      <main className={`flex-1 flex flex-col overflow-auto w-full ${isMobile ? 'pt-16' : 'ml-64'}`}>
        <div className="container mx-auto p-4 md:p-6 flex-1 overflow-auto w-full">
          <Outlet context={{ openChat }} />
        </div>
      </main>
      
      <Toaster />
      
      <ChatModal
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        recipientId={chatRecipient.id}
        recipientName={chatRecipient.name}
        recipientAvatar={chatRecipient.avatar}
      />
    </div>
  );
};

export default AppLayout;
