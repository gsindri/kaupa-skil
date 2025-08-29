
import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-provider'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { ElevationBanner } from './ElevationBanner'
import { CartDrawer } from '@/components/cart/CartDrawer'

interface FullWidthLayoutProps {
  children: React.ReactNode
}

function FullWidthLayoutContent({ children }: FullWidthLayoutProps) {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      <EnhancedAppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavigation />

        <main className="app-scroll flex-1 pt-[var(--header-h)] transition-all duration-200 will-change-auto motion-reduce:transition-none">
          <ElevationBanner />
          {children}
        </main>
      </div>

      <CartDrawer />
    </div>
  )
}

export function FullWidthLayout({ children }: FullWidthLayoutProps) {
  return (
    <SidebarProvider>
      <FullWidthLayoutContent>{children}</FullWidthLayoutContent>
    </SidebarProvider>
  )
}
