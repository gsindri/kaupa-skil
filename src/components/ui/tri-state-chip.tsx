import * as React from 'react'
import { cn } from '@/lib/utils'
import type { TriState } from '@/state/catalogFilters'

interface TriStateFilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  state: TriState
  onStateChange: (state: TriState) => void
  includeLabel?: string
  excludeLabel?: string
  offLabel?: string
  includeAriaLabel?: string
  excludeAriaLabel?: string
  offAriaLabel?: string
  includeClassName?: string
  excludeClassName?: string
}

export function TriStateFilterChip({
  state,
  onStateChange,
  className,
  includeLabel = 'In stock',
  excludeLabel = 'Not in stock',
  offLabel = 'All',
  includeAriaLabel = 'Filter: only in stock',
  excludeAriaLabel = 'Filter: not in stock',
  offAriaLabel,
  includeClassName,
  excludeClassName,
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

  const label =
    state === 'include'
      ? includeLabel
      : state === 'exclude'
        ? excludeLabel
        : offLabel
  const ariaLabel =
    state === 'include'
      ? includeAriaLabel
      : state === 'exclude'
        ? excludeAriaLabel
        : offAriaLabel ?? `${offLabel} filter off`

  const styles =
    state === 'include'
      ? includeClassName ?? 'bg-green-500 text-white border-green-500'
      : state === 'exclude'
        ? excludeClassName ?? 'bg-red-500 text-white border-red-500'
        : 'border-input text-foreground'

  return (
    <button
      type="button"
      role="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
        className={cn(
          'inline-flex h-8 w-auto whitespace-nowrap items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors focus:outline-none',
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
