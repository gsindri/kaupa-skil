import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-provider'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <SidebarProvider>
      <div
        className="min-h-screen grid"
        style={{ gridTemplateColumns: 'var(--sidebar-width,16rem) minmax(0,1fr)' }}
      >
        <aside className="sticky top-0 h-screen w-[var(--sidebar-width,16rem)]">
          <EnhancedAppSidebar />
        </aside>

        <div className="min-w-0 overflow-y-auto">
          <TopNavigation />
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </div>
      </div>

      <CartDrawer />
    </SidebarProvider>
  )
}
