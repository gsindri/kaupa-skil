
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

            <main className="app-scroll flex-1 pt-[var(--header-h)]">
              <ElevationBanner />
              <div className="p-6">
                {children}
              </div>
            </main>
        </div>
        
        <CartDrawer />
      </div>
    </SidebarProvider>
  )
}
