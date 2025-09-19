import * as React from 'react'
import { DropdownMenuContent } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type PopCardProps = React.ComponentProps<typeof DropdownMenuContent>

export function PopCard({
  children,
  className,
  sideOffset = 8,
  align = 'start',
  ...props
}: PopCardProps) {
  return (
    <DropdownMenuContent
      sideOffset={sideOffset}
      align={align}
      className={cn(
        'tw-pop w-[320px] p-2 shadow-lg will-change-transform',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
        'data-[side=right]:slide-in-from-left-1 data-[side=left]:slide-in-from-right-1',
        className
      )}
      {...props}
    >
      {children}
    </DropdownMenuContent>
  )
}
