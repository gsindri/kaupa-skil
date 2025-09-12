import React from 'react'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'

type EnhancedAppSidebarProps = React.ComponentProps<typeof Sidebar>

export function EnhancedAppSidebar({ children, ...props }: EnhancedAppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarContent className="pt-[var(--sidebar-offset)] data-[collapsible=icon]:pt-[var(--sidebar-offset-rail)]">
        {children}
      </SidebarContent>
    </Sidebar>
  )
}

export default EnhancedAppSidebar

