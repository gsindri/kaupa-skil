
import React from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { ElevationBanner } from './ElevationBanner'
import { Toaster } from '@/components/ui/toaster'
import { CartDrawer } from '@/components/cart/CartDrawer'

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <EnhancedAppSidebar />
        <main className="flex-1 overflow-auto">
          <TopNavigation />
          <div className="p-4">
            <ElevationBanner />
            <Outlet />
          </div>
        </main>
        <CartDrawer />
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
