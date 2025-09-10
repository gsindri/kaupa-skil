import React from 'react'
import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'
import { PrimaryNavRail } from './PrimaryNavRail'
import { SecondaryPanel } from './SecondaryPanel'
import { LayoutProvider, useLayout } from './LayoutContext'

interface AppLayoutProps {
  header?: React.ReactNode
  secondary?: React.ReactNode
  children?: React.ReactNode
}

export function AppLayout({ header, secondary, children }: AppLayoutProps) {
  return (
    <LayoutProvider>
      <AppLayoutInner header={header} secondary={secondary}>
        {children ?? <Outlet />}
      </AppLayoutInner>
    </LayoutProvider>
  )
}

function AppLayoutInner({ header, secondary, children }: AppLayoutProps) {
  const { panelOpen } = useLayout()

  return (
    <div className="min-h-dvh">
      <div id="catalogHeader">
        <TopNavigation />
        {header}
      </div>

      <aside
        className="fixed inset-y-0 left-0 z-40 flex w-[var(--rail-w)] flex-col items-center bg-gradient-to-b from-[#0B1220] via-[#0E1B35] to-[#0E2A5E] pt-3"
        aria-label="Primary"
      >
        <PrimaryNavRail />
      </aside>

      <aside
        className="fixed inset-y-0 right-0 z-30 w-[var(--panel-w)] bg-background border-l"
        aria-label="Secondary"
        aria-hidden={!panelOpen}
      >
        <SecondaryPanel>{secondary}</SecondaryPanel>
      </aside>

      <main
        className="relative"
        style={{ paddingLeft: 'var(--rail-w)', paddingRight: 'var(--panel-w)' }}
      >
        <div id="headerSpacer" style={{ height: 'var(--header-h)' }} aria-hidden />
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}

