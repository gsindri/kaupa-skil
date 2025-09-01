import React from 'react'
import { cn } from '@/lib/utils'

interface HeroSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rightSlot?: React.ReactNode
}

/**
 * A large search input used on pages that require prominent product searching.
 * The component forwards refs to the underlying input element and supports an
 * optional slot on the right side for icons or buttons (e.g. voice search).
 */
const HeroSearchInput = React.forwardRef<HTMLInputElement, HeroSearchInputProps>(
  ({ className, rightSlot, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          ref={ref}
          {...props}
          className={cn(
            'h-12 w-full rounded-md border-2 border-input bg-muted/30 px-4 pr-12 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {rightSlot}
          </div>
        )}
      </div>
    )
  }
)

HeroSearchInput.displayName = 'HeroSearchInput'

export { HeroSearchInput }
