
import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import AuthProvider from '@/contexts/AuthProvider'
import BasketProvider from '@/contexts/BasketProvider'
import SettingsProvider from '@/contexts/SettingsProvider'
import ComparisonProvider from '@/contexts/ComparisonContext'
import { LanguageProvider } from '@/contexts/LanguageProvider'
import { router } from '@/router'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary'

function App() {
  return (
    <GlobalErrorBoundary>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <ErrorBoundary>
                <AuthProvider>
                  <ErrorBoundary>
                    <BasketProvider>
                      <ErrorBoundary>
                        <SettingsProvider>
                          <LanguageProvider>
                            <ComparisonProvider>
                              <RouterProvider router={router} future={{ v7_startTransition: true }} />
                              <Toaster />
                            </ComparisonProvider>
                          </LanguageProvider>
                        </SettingsProvider>
                      </ErrorBoundary>
                    </BasketProvider>
                  </ErrorBoundary>
                </AuthProvider>
              </ErrorBoundary>
            </TooltipProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ErrorBoundary>
    </GlobalErrorBoundary>
  )
}

export default App
