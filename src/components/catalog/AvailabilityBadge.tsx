import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/timeAgo'
import { Clock, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'

interface AvailabilityBadgeProps {
  status?: AvailabilityStatus | null
  updatedAt?: string | null
}

const MAP: Record<AvailabilityStatus, { icon: string; label: string; className: string; aria: string }> = {
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
    icon: '?',
    label: '—',
    className: 'bg-muted text-muted-foreground',
    aria: 'Availability unknown',
  },
}

export default function AvailabilityBadge({ status = 'UNKNOWN', updatedAt }: AvailabilityBadgeProps) {
  const isChecking = status === null
  const isStale =
    !isChecking && updatedAt
      ? Date.now() - new Date(updatedAt).getTime() > 24 * 60 * 60 * 1000
      : false

  const base = MAP[status ?? 'UNKNOWN'] ?? MAP.UNKNOWN

  let iconNode: ReactNode = <span aria-hidden="true">{base.icon}</span>
  let label: string | null = base.label
  let className = base.className
  let aria = base.aria

  if (isChecking) {
    iconNode = <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
    label = null
    className = 'bg-muted text-muted-foreground'
    aria = 'Checking availability'
  } else if (isStale) {
    iconNode = <Clock className="h-3 w-3" aria-hidden="true" />
    label = 'Stale'
    className = 'bg-muted text-muted-foreground'
    aria = 'Availability data stale'
  }

  const time = updatedAt ? timeAgo(updatedAt) : null
  const ariaLabel = time ? `${aria}, checked ${time}` : aria

  return (
    <Badge
      className={`gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
      aria-label={ariaLabel}
      tabIndex={0}
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
}

