import React, { ReactNode, useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'
import { PrimaryNavRail } from './PrimaryNavRail'
import { SecondaryPanel } from './SecondaryPanel'

interface AppLayoutProps {
  header?: ReactNode
  secondary?: ReactNode
  panelOpen?: boolean
  children?: ReactNode
}

export function AppLayout({ header, secondary, panelOpen = false, children }: AppLayoutProps) {
  const style = useMemo(
    () => ({
      ['--rail-w' as any]: '72px',
      ['--panel-w' as any]: panelOpen ? '300px' : '0px',
      ['--header-left' as any]: 'var(--rail-w)',
    }),
    [panelOpen]
  )

  return (
    <div className="min-h-dvh" style={style}>
      <div
        style={{ position: 'fixed', insetInlineStart: 'var(--rail-w)', insetInlineEnd: 0, top: 0, zIndex: 50 }}
      >
        <TopNavigation />
        {header}
      </div>

      <aside
        className="fixed inset-y-0 left-0 z-40 w-[var(--rail-w)] bg-gradient-to-b from-[#0B1220] via-[#0E1B35] to-[#0E2A5E] flex flex-col items-center pt-3"
        aria-label="Primary"
      >
        <PrimaryNavRail />
      </aside>

      <aside
        className="fixed inset-y-0 z-30 left-[var(--rail-w)] w-[var(--panel-w)] bg-background border-r"
        aria-label="Secondary"
      >
        {secondary ? <SecondaryPanel>{secondary}</SecondaryPanel> : null}
      </aside>

      <main
        className="relative"
        style={{ paddingLeft: 'calc(var(--rail-w) + var(--panel-w))', paddingRight: 0 }}
      >
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="h-14" />
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}

export default AppLayout
