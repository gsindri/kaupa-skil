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
      <div
        className="min-h-screen grid bg-background"
        style={{ gridTemplateColumns: 'var(--sidebar-width,16rem) minmax(0,1fr)' }}
      >
        <aside className="sticky top-0 h-screen w-[var(--sidebar-width,16rem)]">
          <EnhancedAppSidebar />
        </aside>

        <div className="min-w-0 overflow-y-auto">
          <TopNavigation />

          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
              <ElevationBanner />
              {children}
            </div>
          </div>
        </div>
      </div>

      <CartDrawer />
    </SidebarProvider>
  )
}
