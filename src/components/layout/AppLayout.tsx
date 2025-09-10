import React, { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'
import { PrimaryNavRail } from './PrimaryNavRail'
import { AppChrome } from './AppChrome'

interface AppLayoutProps {
  header?: ReactNode
  secondary?: ReactNode
  panelOpen?: boolean
  children?: ReactNode
  headerRef?: React.Ref<HTMLDivElement>
  headerClassName?: string
}

export function AppLayout({ 
  header, 
  children, 
  headerRef, 
  headerClassName 
}: AppLayoutProps) {
  return (
    <div
      className="min-h-dvh grid"
      style={{ gridTemplateColumns: 'var(--layout-rail,72px) 1fr' }}
    >
      <AppChrome />

      {/* Left rail */}
      <aside
        className="sticky top-0 h-dvh"
        style={{ zIndex: 'var(--z-rail,40)' }}
      >
        <PrimaryNavRail />
      </aside>

      {/* Right column: header + page */}
      <div className="relative">
        {/* Header is now scoped to the right column only */}
        <div
          id="catalogHeader"
          ref={headerRef}
          className={headerClassName}
          style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header,30)' }}
        >
          <TopNavigation />
          {header}
        </div>

        {/* Content; if header overlays, pad with the measured height */}
        <main style={{ paddingTop: 'var(--header-h, var(--layout-header-h,56px))' }}>
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
