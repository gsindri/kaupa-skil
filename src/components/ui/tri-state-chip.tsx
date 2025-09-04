import * as React from 'react'
import { cn } from '@/lib/utils'
import type { TriStock } from '@/state/catalogFilters'

interface TriStateFilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  state: TriStock
  onStateChange: (state: TriStock) => void
}

export function TriStateFilterChip({ state, onStateChange, className, ...props }: TriStateFilterChipProps) {
  const cycle = (reverse = false) => {
    const next = reverse
      ? state === 'off'
        ? 'exclude'
        : state === 'exclude'
          ? 'include'
          : 'off'
      : state === 'off'
        ? 'include'
        : state === 'include'
          ? 'exclude'
          : 'off'
    onStateChange(next)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    cycle(e.shiftKey)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      cycle(e.shiftKey)
    }
  }

  const label = state === 'exclude' ? 'Not in stock' : 'In stock'
  const ariaLabel =
    state === 'include'
      ? 'Filter: only in stock'
      : state === 'exclude'
        ? 'Filter: not in stock'
        : 'In stock filter off'

  const styles =
    state === 'include'
      ? 'bg-green-500 text-white border-green-500'
      : state === 'exclude'
        ? 'bg-red-500 text-white border-red-500'
        : 'border-input text-foreground'

  return (
    <button
      type="button"
      role="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex h-8 w-28 items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        styles,
        className,
      )}
      {...props}
    >
      {label}
    </button>
  )
}

export default TriStateFilterChip
