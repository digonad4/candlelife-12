
import { Outlet } from "react-router-dom";
import { AppSidebar } from "../AppSidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { Toaster } from "../ui/toaster";
import { useState } from "react";
import { ChatModal } from "../social/ChatModal";

const AppLayout = () => {
  const { isSidebarOpen, isMobile } = useSidebar();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState({ id: "", name: "", avatar: "" });
  
  // Function to open chat from anywhere in the app
  const openChat = (userId: string, userName: string, userAvatar?: string) => {
    setChatRecipient({
      id: userId,
      name: userName,
      avatar: userAvatar || ""
    });
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar openChat={openChat} />
        
        <main
          className={`flex-1 flex flex-col overflow-auto transition-all duration-300 ${
            isMobile ? "w-full" : isSidebarOpen ? "ml-64" : "ml-16"
          }`}
        >
          <div className="p-4 md:p-6 flex-1 overflow-auto">
            <Outlet context={{ openChat }} />
          </div>
        </main>
      </div>
      
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
