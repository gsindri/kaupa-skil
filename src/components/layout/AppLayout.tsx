import React, { ReactNode, useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'
import { PrimaryNavRail } from './PrimaryNavRail'
import { SecondaryPanel } from './SecondaryPanel'
import { AppChrome } from './AppChrome'

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
      <AppChrome />

      {/* Header */}
      <div
        style={{ position: 'fixed', insetInlineStart: 'var(--rail-w)', insetInlineEnd: 0, top: 0, zIndex: 40 }}
      >
        <TopNavigation />
        {header}
      </div>

      {/* Rail */}
      <aside
        className="fixed inset-y-0 left-0 z-40 w-[var(--rail-w)] bg-transparent flex flex-col items-center pt-3"
        aria-label="Primary"
      >
        <PrimaryNavRail />
      </aside>

      {/* Secondary panel */}
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
          <div className="h-[var(--chrome-h,56px)]" />
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}

export default AppLayout
