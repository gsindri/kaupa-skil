
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
    <div
      className="min-h-screen grid bg-background"
      style={{ gridTemplateColumns: 'var(--sidebar-width,16rem) minmax(0,1fr)' }}
    >
      <aside className="sticky top-0 h-screen w-[var(--sidebar-width,16rem)]">
        <EnhancedAppSidebar />
      </aside>

      <div className="min-w-0 flex flex-col">
        <TopNavigation />

        <main className="app-scroll flex-1 pt-[var(--header-h)] transition-all duration-200 will-change-auto motion-reduce:transition-none">
          <ElevationBanner />
          {children}
        </main>
      </div>
    </div>
  )
}

export function FullWidthLayout({ children }: FullWidthLayoutProps) {
  return (
    <SidebarProvider>
      <FullWidthLayoutContent>{children}</FullWidthLayoutContent>
      <CartDrawer />
    </SidebarProvider>
  )
}
