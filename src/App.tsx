
import "./App.css";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { useSidebar } from "./context/SidebarContext";
import { AppSidebar } from "./components/AppSidebar";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import NotFound from "./pages/NotFound";
import Clients from "./pages/Clients";
import InvoicedTransactions from "./pages/InvoicedTransactions";
import { useEffect } from "react";

function App() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isSidebarOpen } = useSidebar();
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Component to handle redirects based on authentication
  const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
    return user ? <>{children}</> : <Navigate to="/login" replace />;
  };

  const RedirectToCorrectLanding = () => {
    return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
  };

  return (
    <div className="app flex h-screen overflow-hidden">
      {user && <AppSidebar />}
      <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${user && isSidebarOpen ? "ml-64" : user ? "ml-16" : "ml-0"}`}>
        <Routes>
          <Route path="/" element={<RedirectToCorrectLanding />} />
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
  );
}

export default App;
