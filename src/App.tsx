import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthProvider'
import { SettingsProvider } from '@/contexts/SettingsProvider'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { BasketProvider } from '@/contexts/BasketProvider'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <BasketProvider>
            <RouterProvider router={router} />
          </BasketProvider>
        </SettingsProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
