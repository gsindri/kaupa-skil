
import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { ElevationBanner } from './ElevationBanner'
import { BasketDrawer } from '@/components/cart/BasketDrawer'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <EnhancedAppSidebar />
        
        <div className="flex-1 flex flex-col">
          <ElevationBanner />
          <TopNavigation />
          
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
        
        <BasketDrawer />
      </div>
    </SidebarProvider>
  )
}
