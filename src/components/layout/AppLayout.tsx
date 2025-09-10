import React, { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { FullWidthLayout } from './FullWidthLayout'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  header?: ReactNode
  secondary?: ReactNode
  panelOpen?: boolean
  children?: ReactNode
}

export function AppLayout({ header, secondary, panelOpen = false, children }: AppLayoutProps) {
  return (
    <FullWidthLayout header={header}>
      <div className="flex">
        {secondary && (
          <aside
            className={cn(
              'transition-all overflow-hidden border-r bg-background',
              panelOpen ? 'w-[300px]' : 'w-0'
            )}
            aria-label="Secondary"
          >
            {secondary}
          </aside>
        )}
        <div className="flex-1 min-w-0">{children ?? <Outlet />}</div>
      </div>
    </FullWidthLayout>
  )
}

export default AppLayout
