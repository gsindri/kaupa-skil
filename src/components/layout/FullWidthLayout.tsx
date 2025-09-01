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
          className="min-h-screen grid transition-[grid-template-columns] duration-300 ease-in-out"
          style={{ gridTemplateColumns: 'var(--sidebar-width,16rem) minmax(0,1fr)' }}
        >
          <aside className="sticky top-0 h-svh w-[var(--sidebar-width,16rem)] transition-[width] duration-300 ease-in-out">
            <EnhancedAppSidebar />
          </aside>

          <div className="min-w-0 h-svh flex flex-col transition-all duration-300 ease-in-out">
            <TopNavigation />
            <div className="app-scroll flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
              {children}
            </div>
          </div>
        </div>

        <CartDrawer />
      </SidebarProvider>
  )
}
