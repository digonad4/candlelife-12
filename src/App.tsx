
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { RealtimeProvider } from "@/context/RealtimeContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { nativeService } from "@/services/NativeService";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Expenses from "./pages/Expenses";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";
import Clients from "./pages/Clients";
import InvoicedTransactions from "./pages/InvoicedTransactions";
import ChatPage from "./pages/ChatPage";
import ChatConversation from "./pages/ChatConversation";
import Social from "./pages/Social";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  // Inicializar serviços nativos
  useEffect(() => {
    nativeService.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <RealtimeProvider>
                <SidebarProvider>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/index" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/" element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="transactions" element={<Transactions />} />
                      <Route path="expenses" element={<Expenses />} />
                      <Route path="goals" element={<Goals />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="change-password" element={<ChangePassword />} />
                      <Route path="clients" element={<Clients />} />
                      <Route path="invoiced" element={<InvoicedTransactions />} />
                      <Route path="chat" element={<ChatPage />} />
                      <Route path="chat/:userId" element={<ChatConversation />} />
                      <Route path="social" element={<Social />} />
                    </Route>
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </SidebarProvider>
              </RealtimeProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
