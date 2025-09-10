import React from 'react'
import { Outlet } from 'react-router-dom'
import { CompactNavRail } from './CompactNavRail'
import { TopNavigation } from './TopNavigation'
import { CartDrawer } from '@/components/cart/CartDrawer'

export function AppLayout({ header, children }: { header?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <>
      <div className="min-h-dvh grid [grid-template-columns:var(--rail)_1fr] bg-[var(--surface)]">
        <aside className="sticky top-0 h-dvh z-30 bg-[var(--brand-surface)] border-r border-white/10">
          <CompactNavRail />
        </aside>

        <div className="relative">
          <header id="catalogHeader" className="sticky top-0 z-40 shadow-none">
            <div className="h-0.5 bg-[var(--brand-accent)]" />
            <div className="bg-[var(--brand-surface)]">
              <TopNavigation />
              {header}
            </div>
          </header>

          <main className="min-h-[calc(100dvh-var(--header))]">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
      <CartDrawer />
    </>
  )
}

export default AppLayout
