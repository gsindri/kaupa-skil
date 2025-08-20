
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
      <div className="min-h-screen flex w-full bg-background">
        <EnhancedAppSidebar />
        
        <div className="flex-1 flex flex-col">
          <TopNavigation />

          <main className="flex-1 overflow-auto pt-[var(--header-h)] min-h-screen">
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
