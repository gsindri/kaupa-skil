import * as React from 'react'
import { cn } from '@/lib/utils'
import type { TriState } from '@/state/catalogFilters'

interface TriStateFilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  state: TriState
  onStateChange: (state: TriState) => void
  includeLabel?: string
  excludeLabel?: string
  includeAriaLabel?: string
  excludeAriaLabel?: string
  offAriaLabel?: string
}

export function TriStateFilterChip({
  state,
  onStateChange,
  className,
  includeLabel = 'In stock',
  excludeLabel = 'Not in stock',
  includeAriaLabel = 'Filter: only in stock',
  excludeAriaLabel = 'Filter: not in stock',
  offAriaLabel,
  ...props
}: TriStateFilterChipProps) {
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

  const label = state === 'exclude' ? excludeLabel : includeLabel
  const ariaLabel =
    state === 'include'
      ? includeAriaLabel
      : state === 'exclude'
        ? excludeAriaLabel
        : offAriaLabel ?? `${includeLabel} filter off`

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
