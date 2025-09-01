import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-provider'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { cn } from '@/lib/utils'

interface FullWidthLayoutProps {
  children: React.ReactNode
  offsetContent?: boolean
}

export function FullWidthLayout({ children, offsetContent = true }: FullWidthLayoutProps) {
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
            className={cn(
              'app-scroll flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12',
              offsetContent && 'pt-[var(--header-h)]',
            )}
          >
            {children}
          </div>
        </div>
      </div>

      <CartDrawer />
    </SidebarProvider>
  )
}
