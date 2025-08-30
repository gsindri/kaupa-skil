import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-provider'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { CartDrawer } from '@/components/cart/CartDrawer'

interface FullWidthLayoutProps {
  children: React.ReactNode
}

export function FullWidthLayout({ children }: FullWidthLayoutProps) {
  return (
    <SidebarProvider>
      <div
        className="min-h-screen grid"
        style={{ gridTemplateColumns: 'var(--sidebar-width,16rem) minmax(0,1fr)' }}
      >
        {/* Sidebar column */}
        <aside className="sticky top-0 h-svh w-[var(--sidebar-width,16rem)]">
          <EnhancedAppSidebar />
        </aside>

        {/* Main column */}
        <div className="min-w-0 h-svh flex flex-col">
          <TopNavigation />
          {/* The ONLY scroll container */}
          <div
            className={`app-scroll flex-1 min-h-0 overflow-y-auto pt-[var(--header-h)] px-8 sm:px-10 lg:px-12 xl:px-14 2xl:px-16`}
          >
            {children}
          </div>
        </div>
      </div>

      <CartDrawer />
    </SidebarProvider>
  )
}
