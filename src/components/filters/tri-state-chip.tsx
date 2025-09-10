import * as React from 'react'
import { cn } from '@/lib/utils'

export type Tri = -1 | 0 | 1

interface TriStateChipProps {
  label: string
  value: Tri | undefined
  onChange: (next: Tri) => void
  className?: string
}

export function TriStateChip({ label, value = 0, onChange, className }: TriStateChipProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next: Tri = e.altKey ? (value === -1 ? 0 : -1) : (value === 0 ? 1 : value === 1 ? 0 : 0)
    onChange(next)
  }
  const stateStyles =
    value === 1 ? 'bg-emerald-600 text-white hover:bg-emerald-700'
    : value === -1 ? 'bg-rose-600 text-white hover:bg-rose-700'
    : 'bg-muted hover:bg-muted/70 text-foreground'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value === 1}
      aria-label={`${label}${value===1?' included':value===-1?' excluded':''}`}
      onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); onChange(value === -1 ? 0 : -1) }}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition',
        stateStyles,
        className
      )}
      title="Click: include/clear • Alt-click: exclude/clear • Right-click: exclude"
    >
      {value === 1 ? '✓ ' : value === -1 ? '⨯ ' : ''}{label}
    </button>
  )
}
