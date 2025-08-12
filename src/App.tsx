
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import Dashboard from "./pages/Dashboard";
import Compare from "./pages/Compare";
import Suppliers from "./pages/Suppliers";
import Orders from "./pages/Orders";
import PriceHistory from "./pages/PriceHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthGate>
            <AppLayoutNew>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/history" element={<PriceHistory />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayoutNew>
          </AuthGate>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
