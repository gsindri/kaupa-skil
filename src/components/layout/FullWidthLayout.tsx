import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-provider'
import { EnhancedAppSidebar } from './EnhancedAppSidebar'
import { TopNavigation } from './TopNavigation'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { cn } from '@/lib/utils'

interface FullWidthLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  headerClassName?: string
  headerRef?: React.Ref<HTMLDivElement>
  contentProps?: React.HTMLAttributes<HTMLDivElement>
}

export function FullWidthLayout({
  children,
  header,
  headerClassName,
  headerRef,
  contentProps,
}: FullWidthLayoutProps) {
  const { className: contentClassName, style: contentStyle, ...restContentProps } = contentProps || {}

  React.useEffect(() => {
    const sidebar = document.getElementById('appSidebar')
    if (!sidebar) return
    const apply = () => {
      const isMobile = window.matchMedia('(max-width: 1024px)').matches
      const w = isMobile ? 0 : Math.round(sidebar.getBoundingClientRect().width || 0)
      document.documentElement.style.setProperty('--header-left', `${w}px`)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(sidebar)
    window.addEventListener('resize', apply)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [])

  return (
      <SidebarProvider>
        <div
          className="min-h-screen grid transition-[grid-template-columns] duration-300 ease-in-out"
          style={{ gridTemplateColumns: 'var(--sidebar-width,16rem) minmax(0,1fr)' }}
        >
          <aside
            id="appSidebar"
            className="sticky top-0 h-svh w-[var(--sidebar-width,16rem)] transition-[width] duration-300 ease-in-out"
          >
            <EnhancedAppSidebar />
          </aside>

          <div className="min-w-0 min-h-screen flex flex-col transition-all duration-300 ease-in-out">
            <div ref={headerRef} id="catalogHeader" className={cn(headerClassName)}>
              <TopNavigation />
              {header && (
                <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">{header}</div>
              )}
            </div>
            <div
              id="catalogContent"
              className={cn(
                'flex-1 min-h-0 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12',
                contentClassName,
              )}
              style={{ ...contentStyle }}
              {...restContentProps}
            >
              <div id="headerSpacer" style={{ height: 'var(--header-h)' }} aria-hidden />
              {children}
            </div>
          </div>
        </div>

        <CartDrawer />
      </SidebarProvider>
  )
}
