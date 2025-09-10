import * as React from 'react'
import { cn } from '@/lib/utils'
import type { TriState } from '@/lib/catalogFilters'

export interface TriStateChipProps
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

export function TriStateChip({
  state,
  onStateChange,
  className,
  includeLabel = 'Include',
  excludeLabel = 'Exclude',
  offLabel = 'All',
  includeAriaLabel = 'Filter: include only',
  excludeAriaLabel = 'Filter: exclude only',
  offAriaLabel,
  includeClassName,
  excludeClassName,
  ...props
}: TriStateChipProps) {
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
    cycle(e.shiftKey || e.altKey)
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    cycle(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      cycle(e.shiftKey || e.altKey)
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
      onContextMenu={handleContextMenu}
      className={cn(
        // Responsive width and no wrapping to keep chip labels on a single line
        'inline-flex h-8 w-auto whitespace-nowrap items-center justify-center rounded-pill border px-3 text-sm font-medium transition-colors duration-fast ease-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] motion-reduce:transition-none',
        styles,
        className,
      )}
      {...props}
    >
      {label}
    </button>
  )
}

export default TriStateChip
