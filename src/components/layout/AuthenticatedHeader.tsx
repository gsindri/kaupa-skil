import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AppChrome } from './AppChrome'
import { TopNavigation } from './TopNavigation'

interface AuthenticatedHeaderProps {
  children?: ReactNode
  className?: string
}

/**
 * Wrapper for authenticated app header with spacer for fixed positioning
 */
export function AuthenticatedHeader({ 
  children, 
  className
}: AuthenticatedHeaderProps) {
  return (
    <>
      <div 
        id="authenticated-header"
        className={cn("z-50", className)}
      >
        <AppChrome />
        <TopNavigation />
        {children}
      </div>
      <div id="authenticated-header-spacer" aria-hidden="true" />
    </>
  )
}
