
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { useSidebar } from "./hooks/useSidebar";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import NotFound from "./pages/NotFound";
import Clients from "./pages/Clients";
import InvoicedTransactions from "./pages/InvoicedTransactions";
import Expenses from "./pages/Expenses";
import Social from "./pages/Social";
import { useEffect } from "react";
import { AppSidebar } from "./components/AppSidebar";
import Index from "./pages/Index";
import { supabase } from "./integrations/supabase/client";

function App() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isSidebarOpen } = useSidebar();
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Registrar a sessão atual do usuário quando ele fizer login
  useEffect(() => {
    if (user) {
      const registerSession = async () => {
        try {
          // Obter informações sobre o dispositivo
          const userAgent = navigator.userAgent;
          let deviceInfo = "Dispositivo desconhecido";
          
          if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            deviceInfo = "Dispositivo móvel";
          } else {
            deviceInfo = "Computador";
          }
          
          // Buscar se já existe uma sessão com esse dispositivo
          const { data: existingSessions } = await supabase
            .from("user_sessions")
            .select("*")
            .eq("user_id", user.id)
            .eq("device_info", deviceInfo);
            
          // Se não existir, criar uma nova
          if (!existingSessions || existingSessions.length === 0) {
            await supabase
              .from("user_sessions")
              .insert({
                user_id: user.id,
                device_info: deviceInfo,
              });
          } else {
            // Se existir, atualizar o timestamp
            await supabase
              .from("user_sessions")
              .update({ last_active: new Date().toISOString() })
              .eq("id", existingSessions[0].id);
          }
        } catch (error) {
          console.error("Erro ao registrar sessão:", error);
        }
      };
      
      registerSession();
    }
  }, [user]);

  // Function to open chat modal
  const openChat = (userId: string, userName: string, userAvatar?: string) => {
    window.dispatchEvent(
      new CustomEvent("open-chat", {
        detail: { userId, userName, userAvatar }
      })
    );
  };

  // Component to handle redirects based on authentication
  const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
    return user ? <>{children}</> : <Navigate to="/login" replace />;
  };

  return (
    <>
      {user && <AppSidebar openChat={openChat} />}
      <div className={`flex-1 overflow-hidden transition-all duration-300 ${user && isSidebarOpen ? "ml-64" : user ? "ml-16" : "ml-0"}`}>
        <main className="h-full hide-scrollbar overflow-y-auto">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/dashboard" 
              element={
                <AuthenticatedRoute>
                  <Dashboard />
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/transactions" 
              element={
                <AuthenticatedRoute>
                  <Transactions />
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <AuthenticatedRoute>
                  <Clients />
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/invoiced" 
              element={
                <AuthenticatedRoute>
                  <InvoicedTransactions />
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/expenses" 
              element={
                <AuthenticatedRoute>
                  <Expenses />
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/social" 
              element={
                <AuthenticatedRoute>
                  <Social />
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <AuthenticatedRoute>
                  <Settings />
                </AuthenticatedRoute>
              } 
            />
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;
