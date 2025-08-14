
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/AuthProvider'
import { CartProvider } from '@/contexts/CartProvider'
import { SettingsProvider } from '@/contexts/SettingsProvider'

import AppLayout from '@/layouts/AppLayout'
import Index from '@/pages/Index'
import Dashboard from '@/pages/Dashboard'
import Compare from '@/pages/Compare'
import Orders from '@/pages/Orders'
import Pantry from '@/pages/Pantry'
import Suppliers from '@/pages/Suppliers'
import Settings from '@/pages/Settings'
import Admin from '@/pages/Admin'
import PriceHistory from '@/pages/PriceHistory'
import Discovery from '@/pages/Discovery'
import LoginShowcase from '@/pages/auth/LoginShowcase'
import PasswordReset from '@/pages/auth/PasswordReset'
import NotFound from '@/pages/NotFound'

import Delivery from '@/pages/Delivery'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <CartProvider>
            <SettingsProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<Index />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="compare" element={<Compare />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="delivery" element={<Delivery />} />
                    <Route path="pantry" element={<Pantry />} />
                    <Route path="suppliers" element={<Suppliers />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="admin" element={<Admin />} />
                    <Route path="price-history" element={<PriceHistory />} />
                    <Route path="discovery" element={<Discovery />} />
                  </Route>
                  <Route path="/auth/login" element={<LoginShowcase />} />
                  <Route path="/auth/reset-password" element={<PasswordReset />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SettingsProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
