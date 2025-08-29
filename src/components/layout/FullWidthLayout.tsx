
import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-provider'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { ElevationBanner } from './ElevationBanner'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { useSidebar } from '@/components/ui/use-sidebar'

interface FullWidthLayoutProps {
  children: React.ReactNode
}

function FullWidthLayoutContent({ children }: FullWidthLayoutProps) {
  const { open, openMobile, isMobile } = useSidebar()
  const sidebarOpen = isMobile ? openMobile : open

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      <EnhancedAppSidebar />

      <div className="flex-1 flex flex-col">
        <TopNavigation />

        <main 
          style={{
            '--sidebar-w': sidebarOpen ? 'var(--sidebar-width)' : '0px',
            marginLeft: 'var(--sidebar-w)',
            width: 'calc(100% - var(--sidebar-w))',
          } as React.CSSProperties}
          className="app-scroll flex-1 pt-[var(--header-h)] transition-[margin-left,width] duration-200 will-change-[margin-left,width] motion-reduce:transition-none"
        >
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
      <FullWidthLayoutContent>{children}>
        {children}
      </FullWidthLayoutContent>
    </SidebarProvider>
  )
}
