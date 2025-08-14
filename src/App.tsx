
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthProvider";
import { SettingsProvider } from "./contexts/SettingsProvider";
import { CartProvider } from "./contexts/CartProvider";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Compare from "./pages/Compare";
import Pantry from "./pages/Pantry";
import Orders from "./pages/Orders";
import Suppliers from "./pages/Suppliers";
import PriceHistory from "./pages/PriceHistory";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Discovery from "./pages/Discovery";
import NotFound from "./pages/NotFound";
import LoginShowcase from "./pages/auth/LoginShowcase";
import PasswordReset from "./pages/auth/PasswordReset";
import { OnboardingWizard } from "./components/onboarding/OnboardingWizard";
import { AuthGate } from "./components/auth/AuthGate";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isInitialized, isFirstTime, error } = useAuth()

  console.log('AppRoutes state:', { isInitialized, isFirstTime, error })

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Initializing...</p>
          {error && (
            <p className="text-sm text-destructive max-w-md">{error}</p>
          )}
        </div>
      </div>
    )
  }

  if (isFirstTime) {
    return <OnboardingWizard />
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginShowcase />} />
      <Route path="/auth/login" element={<LoginShowcase />} />
      <Route path="/auth/reset-password" element={<PasswordReset />} />
      <Route path="/" element={<AuthGate><AppLayout><Outlet /></AppLayout></AuthGate>}>
        <Route index element={<Index />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="compare" element={<Compare />} />
        <Route path="pantry" element={<Pantry />} />
        <Route path="orders" element={<Orders />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="price-history" element={<PriceHistory />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<Admin />} />
        <Route path="discovery" element={<Discovery />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SettingsProvider>
              <CartProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
                <Toaster />
                <Sonner />
              </CartProvider>
            </SettingsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
