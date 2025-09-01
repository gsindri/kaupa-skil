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
      <div className="flex flex-col min-h-screen">
        <TopNavigation />

        <div className="flex flex-1 min-h-0">
          <aside className="w-[var(--sidebar-width,16rem)]">
            <EnhancedAppSidebar />
          </aside>

          <div
            className={cn(
              'flex-1 min-w-0 app-scroll overflow-y-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12',
              offsetContent && 'pt-[var(--header-h)]',
            )}
          >
            {children}
          </div>
        </div>

        <CartDrawer />
      </div>
    </SidebarProvider>
  )
}
