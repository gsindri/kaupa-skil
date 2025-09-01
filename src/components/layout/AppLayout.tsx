import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-provider'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <TopNavigation />

        <div className="flex flex-1 min-h-0">
          <aside className="w-[var(--sidebar-width,16rem)]">
            <EnhancedAppSidebar />
          </aside>

          <main className="flex-1 min-w-0 app-scroll pt-[var(--header-h)] overflow-y-auto px-[clamp(16px,2vw,28px)]">
            <Outlet />
          </main>
        </div>

        <CartDrawer />
      </div>
    </SidebarProvider>
  )
}
