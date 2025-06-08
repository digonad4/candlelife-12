
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";

import { AuthProvider } from "@/context/AuthContext";
import { UnifiedThemeProvider } from "@/context/UnifiedThemeContext";
import { MessagesProvider } from "@/context/MessagesContext";
import { GlobalNotificationsProvider } from "@/context/GlobalNotificationsContext";

import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import ChangePassword from "@/pages/ChangePassword";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Expenses from "@/pages/Expenses";
import InvoicedTransactions from "@/pages/InvoicedTransactions";
import Goals from "@/pages/Goals";
import Clients from "@/pages/Clients";
import ChatPage from "@/pages/ChatPage";
import ChatConversationPage from "@/pages/ChatConversationPage";
import Social from "@/pages/Social";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Support from "@/pages/Support";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/NotFound";

import AppLayout from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Native services
import { nativeService } from "@/services/NativeService";
import { nativeThemeService } from "@/services/NativeThemeService";
import { pushNotificationService } from "@/services/PushNotificationService";
import { useMobileNative } from "@/hooks/useMobileNative";

const queryClient = new QueryClient();

// Component to initialize native services
const NativeInitializer = () => {
  const { isNative } = useMobileNative();

  useEffect(() => {
    const initializeNativeServices = async () => {
      console.log('🚀 Initializing native services...');
      
      try {
        // Initialize in order
        await nativeService.initialize();
        await nativeThemeService.initialize();
        await pushNotificationService.initialize();
        
        console.log('✅ All native services initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing native services:', error);
      }
    };

    if (isNative) {
      initializeNativeServices();
    } else {
      console.log('🌐 Running in web mode - native services skipped');
    }
  }, [isNative]);

  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UnifiedThemeProvider>
            <GlobalNotificationsProvider>
              <MessagesProvider>
                <NativeInitializer />
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Index />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="invoiced" element={<InvoicedTransactions />} />
                    <Route path="goals" element={<Goals />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="chat/:userId" element={<ChatConversationPage />} />
                    <Route path="social" element={<Social />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="support" element={<Support />} />
                    <Route path="privacy" element={<Privacy />} />
                    <Route path="terms" element={<Terms />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MessagesProvider>
            </GlobalNotificationsProvider>
          </UnifiedThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
