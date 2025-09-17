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

  const baseStyles =
    'bg-transparent text-[color:var(--ink-dim)]/85 ring-1 ring-inset ring-white/12 hover:bg-white/8 hover:ring-white/20'
  const includeStyles =
    includeClassName ??
    'bg-emerald-400/25 text-emerald-50 ring-emerald-300/60 hover:bg-emerald-400/35 hover:ring-emerald-200/70'
  const excludeStyles =
    excludeClassName ??
    'bg-rose-400/25 text-rose-50 ring-rose-300/60 hover:bg-rose-400/35 hover:ring-rose-200/70'
  const styles =
    state === 'include'
      ? cn(baseStyles, includeStyles)
      : state === 'exclude'
        ? cn(baseStyles, excludeStyles)
        : baseStyles

  return (
    <button
      type="button"
      role="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
      className={cn(
        'inline-flex h-[var(--ctrl-h,40px)] w-auto items-center justify-center whitespace-nowrap rounded-[var(--ctrl-r,12px)] px-3 text-sm font-medium transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--toolbar-bg)] motion-reduce:transition-none',
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
