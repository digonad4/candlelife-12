import "./App.css";
import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { LayoutDashboard, Receipt, Users, FileText, Settings as SettingsIcon, LogOut } from "lucide-react";
import { AppSidebar } from "./components/AppSidebar";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { ChangePassword } from "./pages/ChangePassword";
import { Index } from "./pages/Index";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { NotFound } from "./pages/NotFound";
import Clients from "./pages/Clients";
import InvoicedTransactions from "./pages/InvoicedTransactions";

function App() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    document.body.className = theme === "dark" ? "dark" : "";
  }, [theme]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="app">
      <AppSidebar />
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
    </div>
  );
}

export default App;
