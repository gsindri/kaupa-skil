
import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-provider'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { ElevationBanner } from './ElevationBanner'
import { CartDrawer } from '@/components/cart/CartDrawer'

interface FullWidthLayoutProps {
  children: React.ReactNode
}

export function FullWidthLayout({ children }: FullWidthLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden bg-background">
        <EnhancedAppSidebar />

        <div className="flex-1 flex flex-col">
          <TopNavigation />

          <main className="app-scroll flex-1 pt-[var(--header-h)] w-full">
            <ElevationBanner />
            <div className="px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>

        <CartDrawer />
      </div>
    </SidebarProvider>
  )
}
