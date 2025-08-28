import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-provider'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { ElevationBanner } from './ElevationBanner'
import { CartDrawer } from '@/components/cart/CartDrawer'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden bg-background">
        <EnhancedAppSidebar />

        <div className="flex-1 flex flex-col">
          <TopNavigation />

          <main className="app-scroll flex-1 pt-[var(--header-h)] w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
            <ElevationBanner />
            {children}
          </main>
        </div>

        <CartDrawer />
      </div>
    </SidebarProvider>
  )
}
