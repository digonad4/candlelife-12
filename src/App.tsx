
import "./App.css";
import { Routes, Route, useNavigate } from "react-router-dom";
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

  // Determine if we should show the sidebar based on authentication and current route
  const showSidebar = !!user;

  return (
    <div className="app flex h-screen overflow-hidden">
      {showSidebar && <AppSidebar />}
      <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${showSidebar ? (isSidebarOpen ? "ml-64" : "ml-16") : ""}`}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/invoiced" element={<InvoicedTransactions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
