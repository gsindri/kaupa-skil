import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-provider'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { ElevationBanner } from './ElevationBanner'
import { CartDrawer } from '@/components/cart/CartDrawer'

/**
 * Layout for catalog pages.
 *
 * This layout renders content full-width without `max-w[...]`, `mx-auto`,
 * or horizontal padding.
 */
interface CatalogLayoutProps {
  children: React.ReactNode
}

export function CatalogLayout({ children }: CatalogLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden bg-background">
        <EnhancedAppSidebar />

        <div className="flex-1 flex flex-col">
          <TopNavigation />

          <main className="app-scroll flex-1 pt-[var(--header-h)] w-full">
            <ElevationBanner />
            {children}
          </main>
        </div>

        <CartDrawer />
      </div>
    </SidebarProvider>
  )
}
