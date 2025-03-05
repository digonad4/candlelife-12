
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
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
    document.body.className = theme === "dark" ? "dark" : "";
  }, [theme]);

  // Determine if we should show the sidebar based on authentication
  const showSidebar = !!user;

  return (
    <div className="app flex h-screen overflow-hidden">
      {showSidebar && <AppSidebar />}
      <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${showSidebar ? (isSidebarOpen ? "ml-64" : "ml-16") : ""}`}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Index />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/transactions" element={user ? <Transactions /> : <Navigate to="/login" replace />} />
          <Route path="/clients" element={user ? <Clients /> : <Navigate to="/login" replace />} />
          <Route path="/invoiced" element={user ? <InvoicedTransactions /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
