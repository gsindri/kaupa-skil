import * as React from 'react'
import { DropdownMenuContent } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type PopCardElement = React.ElementRef<typeof DropdownMenuContent>
type PopCardProps = React.ComponentPropsWithoutRef<typeof DropdownMenuContent>

export const PopCard = React.forwardRef<PopCardElement, PopCardProps>(
  (
    {
      children,
      className,
      sideOffset = 8,
      align = 'start',
      ...props
    },
    ref,
  ) => {
    return (
      <DropdownMenuContent
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'tw-pop w-[320px] p-2 shadow-lg will-change-transform',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
          'data-[side=right]:slide-in-from-left-1 data-[side=left]:slide-in-from-right-1',
          className,
        )}
        {...props}
      >
        {children}
      </DropdownMenuContent>
    )
  },
)

PopCard.displayName = 'PopCard'
