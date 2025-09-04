import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/timeAgo'
import { Loader2 } from 'lucide-react'
import { type ReactNode, forwardRef } from 'react'

export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'

interface AvailabilityBadgeProps {
  status?: AvailabilityStatus | null
  updatedAt?: string | null
  tabIndex?: number
}

const MAP: Record<
  AvailabilityStatus,
  { icon?: string; label: string; className: string; aria: string }
> = {
  IN_STOCK: {
    icon: '✓',
    label: 'In',
    className: 'bg-emerald-100 text-emerald-700',
    aria: 'In stock',
  },
  LOW_STOCK: {
    icon: '!',
    label: 'Low',
    className: 'bg-amber-100 text-amber-700',
    aria: 'Low stock',
  },
  OUT_OF_STOCK: {
    icon: '⃠',
    label: 'Out',
    className: 'bg-rose-100 text-rose-700',
    aria: 'Out of stock',
  },
  UNKNOWN: {
    label: '—',
    className: 'bg-muted text-muted-foreground',
    aria: 'Availability unknown',
  },
}

const AvailabilityBadge = forwardRef<HTMLDivElement, AvailabilityBadgeProps>(
  ({ status = 'UNKNOWN', updatedAt, tabIndex = 0 }, ref) => {
  const isChecking = status === null

  const base = MAP[status ?? 'UNKNOWN'] ?? MAP.UNKNOWN

  let iconNode: ReactNode = base.icon ? (
    <span aria-hidden="true">{base.icon}</span>
  ) : null
  let label: string | null = base.label
  let className = base.className
  let aria = base.aria

  if (isChecking) {
    iconNode = <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
    label = null
    className = 'bg-muted text-muted-foreground'
    aria = 'Checking availability'
  }

  const time = updatedAt ? timeAgo(updatedAt) : null
  const ariaLabel = time ? `${aria}, checked ${time}` : aria

  return (
    <Badge
      ref={ref}
      className={`gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
    >
      {iconNode}
      {label === '—' ? (
        <>
          <span aria-hidden="true">—</span>
          <span className="sr-only">No data yet</span>
        </>
      ) : (
        label
      )}
    </Badge>
  )
})

AvailabilityBadge.displayName = 'AvailabilityBadge'

export default AvailabilityBadge

