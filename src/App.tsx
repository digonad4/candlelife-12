
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster"
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import InvoicedTransactions from "./pages/InvoicedTransactions";
import Expenses from "./pages/Expenses";
import Clients from "./pages/Clients";
import Social from "./pages/Social";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import ChangePassword from "./pages/ChangePassword";
import { MessagesProvider } from './context/MessagesContext';
import Goals from "./pages/Goals";

const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <MessagesProvider>
            <Toaster />
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/invoiced" element={<InvoicedTransactions />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </MessagesProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
