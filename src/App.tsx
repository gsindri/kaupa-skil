
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGate } from "./components/auth/AuthGate";
import { AppLayout } from "./components/layout/AppLayout";
import { FirstTimeSetup } from "./components/setup/FirstTimeSetup";
import { useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Compare from "./pages/Compare";
import Orders from "./pages/Orders";
import Suppliers from "./pages/Suppliers";
import PriceHistory from "./pages/PriceHistory";
import Admin from "./pages/Admin";
import LoginShowcase from "./pages/auth/LoginShowcase";
import PasswordReset from "./pages/auth/PasswordReset";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-48"></div>
          <div className="h-4 bg-muted rounded w-32"></div>
        </div>
      </div>
    );
  }

  // If user is authenticated but has no tenant, show first-time setup
  if (user && profile && !profile.tenant_id) {
    return <FirstTimeSetup />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginShowcase />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route
          path="/*"
          element={
            <AuthGate>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/price-history" element={<PriceHistory />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </AuthGate>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
