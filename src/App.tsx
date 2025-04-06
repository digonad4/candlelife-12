
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
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
import Index from "./pages/Index";
import { supabase } from "./integrations/supabase/client";
import { Toaster } from "./components/ui/toaster";
import AppLayout from "./components/layout/AppLayout";

function App() {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Register the current user session when they log in
  useEffect(() => {
    if (user) {
      const registerSession = async () => {
        try {
          // Get device information
          const userAgent = navigator.userAgent;
          let deviceInfo = "Unknown device";
          
          if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            deviceInfo = "Mobile device";
          } else {
            deviceInfo = "Computer";
          }
          
          // Check if a session already exists with this device
          const { data: existingSessions } = await supabase
            .from("user_sessions")
            .select("*")
            .eq("user_id", user.id)
            .eq("device_info", deviceInfo);
            
          // If it doesn't exist, create a new one
          if (!existingSessions || existingSessions.length === 0) {
            await supabase
              .from("user_sessions")
              .insert({
                user_id: user.id,
                device_info: deviceInfo,
              });
          } else {
            // If it exists, update the timestamp
            await supabase
              .from("user_sessions")
              .update({ last_active: new Date().toISOString() })
              .eq("id", existingSessions[0].id);
          }
        } catch (error) {
          console.error("Error registering session:", error);
        }
      };
      
      registerSession();
    }
  }, [user]);

  // Component to handle redirects based on authentication
  const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
    return user ? <>{children}</> : <Navigate to="/login" replace />;
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/change-password" element={<ChangePassword />} />
        
        {/* Authenticated routes using the new AppLayout */}
        <Route element={<AuthenticatedRoute><AppLayout /></AuthenticatedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/invoiced" element={<InvoicedTransactions />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/social" element={<Social />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {!user && <Toaster />}
    </div>
  );
}

export default App;
