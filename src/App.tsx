
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthProvider";
import { SettingsProvider } from "./contexts/SettingsProvider";
import { CartProvider } from "./contexts/CartProvider";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AuthGate } from "./components/auth/AuthGate";
import { AppLayout } from "./components/layout/AppLayout";
import { FirstTimeSetup } from "./components/setup/FirstTimeSetup";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Compare from "./pages/Compare";
import Orders from "./pages/Orders";
import Suppliers from "./pages/Suppliers";
import PriceHistory from "./pages/PriceHistory";
import Pantry from "./pages/Pantry";
import Discovery from "./pages/Discovery";
import Admin from "./pages/Admin";
import LoginShowcase from "./pages/auth/LoginShowcase";
import PasswordReset from "./pages/auth/PasswordReset";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && 'status' in error && typeof error.status === 'number') {
          return error.status >= 500 && failureCount < 2
        }
        return failureCount < 2
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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

  return (
    <Routes>
      <Route path="/login" element={<LoginShowcase />} />
      <Route path="/reset-password" element={<PasswordReset />} />
      <Route 
        path="/setup" 
        element={
          <AuthGate>
            <FirstTimeSetup />
          </AuthGate>
        } 
      />
      <Route
        path="/*"
        element={
          <AuthGate>
            {user && profile && !profile.tenant_id ? (
              <Navigate to="/setup" replace />
            ) : (
              <ErrorBoundary>
                <SettingsProvider>
                  <CartProvider>
                    <Routes>
                      <Route path="/" element={<AppLayout><Outlet /></AppLayout>}>
                        <Route index element={<Index />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="compare" element={<Compare />} />
                        <Route path="pantry" element={<Pantry />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="suppliers" element={<Suppliers />} />
                        <Route path="price-history" element={<PriceHistory />} />
                        <Route path="discovery" element={<Discovery />} />
                        <Route path="admin" element={<Admin />} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </CartProvider>
                </SettingsProvider>
              </ErrorBoundary>
            )}
          </AuthGate>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
