
import { Outlet } from "react-router-dom";
import { AppSidebar } from "../AppSidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { Toaster } from "../ui/toaster";
import { useState } from "react";
import { ChatModal } from "../social/ChatModal";

const AppLayout = () => {
  const { isSidebarOpen } = useSidebar();
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
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar openChat={openChat} />
      
      <main
        className={`pt-6 ${
          isSidebarOpen ? "ml-64" : "ml-16"
        } pb-6 px-6 transition-all duration-300`}
      >
        <Outlet context={{ openChat }} />
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
